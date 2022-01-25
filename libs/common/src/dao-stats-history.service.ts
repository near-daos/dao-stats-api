import {
  Connection,
  InsertResult,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStatsHistory, DaoStatsHistoryDto, DaoStatsMetric } from '.';

export interface DaoStatsHistoryTotalParams {
  contractId: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  dao?: string | string[];
  from?: number;
  to?: number;
  // return absolute or average value per dao
  averagePerDao?: boolean;
  // return total accumulated value(s) instead of daily change, default: true
  totals?: boolean;
}

export type DaoStatsHistoryHistoryParams = DaoStatsHistoryTotalParams;

export interface DaoStatsHistoryHistory {
  date: Date;
  value: number;
}

export type DaoStatsHistoryHistoryResponse = DaoStatsHistoryHistory[];

@Injectable()
export class DaoStatsHistoryService {
  constructor(
    @InjectRepository(DaoStatsHistory)
    private readonly repository: Repository<DaoStatsHistory>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async getPrevTotal({
    contractId,
    metric,
    dao,
  }: {
    contractId: string;
    metric: string;
    dao: string;
  }): Promise<number | undefined> {
    const result = await this.connection
      .getRepository(DaoStatsHistory)
      .createQueryBuilder()
      .select('total')
      .where({
        contractId,
        metric,
        dao,
      })
      .andWhere('date < CURRENT_DATE')
      .orderBy('date', 'DESC')
      .limit(1)
      .getRawOne();

    return result ? parseFloat(result.total) : undefined;
  }

  async createOrUpdate(data: DaoStatsHistoryDto): Promise<InsertResult> {
    let prevTotal: number;

    if (data.change === undefined) {
      prevTotal = await this.getPrevTotal(data);
    }

    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStatsHistory)
      .values({
        ...data,
        change: prevTotal != undefined ? data.total - prevTotal : data.change,
      })
      .orUpdate({
        conflict_target: ['date', 'contract_id', 'metric', 'dao'],
        overwrite: ['total', 'change', 'updated_at'],
      })
      .execute();
  }

  async createIgnore(data: DaoStatsHistoryDto): Promise<InsertResult> {
    let prevTotal: number;

    if (data.change === undefined) {
      prevTotal = await this.getPrevTotal(data);
    }

    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStatsHistory)
      .values({
        ...data,
        change: prevTotal != undefined ? data.total - prevTotal : data.change,
      })
      .onConflict('DO NOTHING')
      .execute();
  }

  private buildWhere(
    query: SelectQueryBuilder<any>,
    tableAliasName: string,
    { contractId, metric, dao }: DaoStatsHistoryTotalParams,
  ): SelectQueryBuilder<any> {
    query.andWhere(`${tableAliasName}.contract_id = :contractId`, {
      contractId,
    });

    if (Array.isArray(metric)) {
      query.andWhere(`${tableAliasName}.metric in (:...metric)`, { metric });
    } else {
      query.andWhere(`${tableAliasName}.metric = :metric`, { metric });
    }

    if (Array.isArray(dao)) {
      query.andWhere(`${tableAliasName}.dao in (:...dao)`, { dao });
    } else if (dao) {
      query.andWhere(`${tableAliasName}.dao = :dao`, { dao });
    }

    return query;
  }

  private buildChangeByDateAndDaoSubQuery(
    query: SelectQueryBuilder<any>,
    params: DaoStatsHistoryTotalParams,
  ): SelectQueryBuilder<any> {
    query
      .select('date, dao, sum(change) as change')
      .from('dao_stats_history', 'h')
      .groupBy('date, dao');

    this.buildWhere(query, 'h', params);

    return query;
  }

  private buildDaoCountSubQuery(
    query: SelectQueryBuilder<any>,
    params: DaoStatsHistoryTotalParams,
  ): SelectQueryBuilder<any> {
    query
      .select('date, count(dao) as dao_count')
      .from('dao_stats_history', 'h2')
      .groupBy('date');

    this.buildWhere(query, 'h2', params);

    return query;
  }

  private buildChangeByDateSubQuery(
    query: SelectQueryBuilder<any>,
    params: DaoStatsHistoryTotalParams,
  ): SelectQueryBuilder<any> {
    query
      .select('date, sum(change) as change')
      .from(
        (subQuery) => this.buildChangeByDateAndDaoSubQuery(subQuery, params),
        'change_by_date_and_dao',
      )
      .groupBy('date');

    return query;
  }

  private buildDailyDataSubQuery(
    query: SelectQueryBuilder<any>,
    { totals = true, averagePerDao, ...params }: DaoStatsHistoryTotalParams,
  ): SelectQueryBuilder<any> {
    query.select('change_by_date.date').from(
      (subQuery) =>
        this.buildChangeByDateSubQuery(subQuery, {
          ...params,
          averagePerDao,
        }),
      'change_by_date',
    );

    if (totals) {
      query.addSelect(
        `sum(change) over (order by change_by_date.date rows between unbounded preceding and current row)${
          averagePerDao ? ' / dao_count' : ''
        }`,
        'value',
      );
    } else {
      query.addSelect(`change${averagePerDao ? ' / dao_count' : ''}`, 'value');
    }

    if (averagePerDao) {
      query.leftJoin(
        (subQuery) => this.buildDaoCountSubQuery(subQuery, params),
        'dc',
        'dc.date = change_by_date.date',
      );
    }

    return query;
  }

  private buildQuery(
    query: SelectQueryBuilder<any>,
    { from, to, ...params }: DaoStatsHistoryTotalParams,
  ): SelectQueryBuilder<any> {
    query.from(
      (subQuery) => this.buildDailyDataSubQuery(subQuery, params),
      'daily_data',
    );

    if (from) {
      query.andWhere('date >= to_timestamp(:from)::date', {
        from: from / 1000,
      });
    }

    if (to) {
      query.andWhere('date <= to_timestamp(:to)::date', {
        to: to / 1000,
      });
    }

    return query;
  }

  async getLastValue(params: DaoStatsHistoryTotalParams): Promise<number> {
    const [result] = await this.buildQuery(
      this.connection.createQueryBuilder(),
      params,
    )
      .orderBy('date', 'DESC')
      .limit(1)
      .execute();

    if (result && result.value) {
      return parseFloat(result.value);
    }

    return 0;
  }

  async getHistory(
    params: DaoStatsHistoryHistoryParams,
  ): Promise<DaoStatsHistoryHistoryResponse> {
    const result = await this.buildQuery(
      this.connection.createQueryBuilder(),
      params,
    )
      .orderBy('date')
      .execute();

    return result.map(({ date, value }) => ({
      date,
      value: parseFloat(value),
    }));
  }
}
