import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStatsDto, DaoStatsHistory, DaoStatsMetric } from '.';

export interface DaoStatsHistoryValueParams {
  from?: number;
  to?: number;
  contractId: string;
  dao?: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  daoAverage?: boolean;
}

export type DaoStatsHistoryHistoryParams = DaoStatsHistoryValueParams;

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

  async createOrUpdate(data: DaoStatsDto): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStatsHistory)
      .values(data)
      .orUpdate({
        conflict_target: ['date', 'contract_id', 'dao', 'metric'],
        overwrite: ['value'],
      })
      .execute();
  }

  async createIgnore(data: DaoStatsDto): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStatsHistory)
      .values(data)
      .onConflict('DO NOTHING')
      .execute();
  }

  async getLastValue({
    contractId,
    dao,
    metric,
    daoAverage,
    from,
    to,
  }: DaoStatsHistoryValueParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`date, dao, sum(value) as value`);

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

    query.andWhere('contract_id = :contractId', { contractId });

    if (Array.isArray(dao)) {
      query.andWhere('dao in (:...dao)', { dao });
    } else if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    if (Array.isArray(metric)) {
      query.andWhere('metric in (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    query.groupBy('date, dao');

    const [subQuery, params] = query.getQueryAndParameters();

    const [result] = await this.connection.query(
      `
          with data as (${subQuery})
          select ${daoAverage ? 'avg' : 'sum'}(value) as value
          from data
          group by date
          order by date desc
          limit 1
      `,
      params,
    );

    if (!result || !result['value']) {
      return 0;
    }

    return parseFloat(result['value']);
  }

  async getHistory({
    contractId,
    dao,
    metric,
    daoAverage,
    from,
    to,
  }: DaoStatsHistoryHistoryParams): Promise<DaoStatsHistoryHistoryResponse> {
    const query = this.repository
      .createQueryBuilder()
      .select(`date, sum(value) as value`);

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

    query.andWhere('contract_id = :contractId', { contractId });

    if (Array.isArray(dao)) {
      query.andWhere('dao in (:...dao)', { dao });
    } else if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    if (Array.isArray(metric)) {
      query.andWhere('metric in (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    query.groupBy('date, dao');

    const [subQuery, params] = query.getQueryAndParameters();

    const result = await this.connection.query(
      `
          with data as (${subQuery})
          select date, ${daoAverage ? 'avg' : 'sum'}(value) as value
          from data
          group by date
          order by date
      `,
      params,
    );

    return result.map(({ date, value }) => ({
      date,
      value: parseFloat(value),
    }));
  }
}
