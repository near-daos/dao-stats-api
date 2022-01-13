import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStatsHistory, DaoStatsHistoryDto, DaoStatsMetric } from '.';

export interface DaoStatsHistoryTotalParams {
  from?: number;
  to?: number;
  contractId: string;
  dao?: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  daoAverage?: boolean;
}

export type DaoStatsHistoryHistoryParams = DaoStatsHistoryTotalParams;

export interface DaoStatsHistoryHistory {
  date: Date;
  total: number;
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

  async getLastTotal({
    contractId,
    dao,
    metric,
    daoAverage,
    from,
    to,
  }: DaoStatsHistoryTotalParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`date, dao, sum(total) as total`);

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

    if (Array.isArray(metric)) {
      query.andWhere('metric in (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    if (Array.isArray(dao)) {
      query.andWhere('dao in (:...dao)', { dao });
    } else if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    query.groupBy('date, dao');

    const [subQuery, params] = query.getQueryAndParameters();

    const [result] = await this.connection.query(
      `
          with data as (${subQuery})
          select ${daoAverage ? 'avg' : 'sum'}(total) as total
          from data
          group by date
          order by date desc
          limit 1
      `,
      params,
    );

    if (result && result.total) {
      return parseFloat(result.total);
    }

    return 0;
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
      .select(`date, sum(total) as total`);

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

    if (Array.isArray(metric)) {
      query.andWhere('metric in (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    if (Array.isArray(dao)) {
      query.andWhere('dao in (:...dao)', { dao });
    } else if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    query.groupBy('date, dao');

    const [subQuery, params] = query.getQueryAndParameters();

    const result = await this.connection.query(
      `
          with data as (${subQuery})
          select date, ${daoAverage ? 'avg' : 'sum'}(total) as total
          from data
          group by date
          order by date
      `,
      params,
    );

    return result.map(({ date, total }) => ({
      date,
      total: parseFloat(total),
    }));
  }
}
