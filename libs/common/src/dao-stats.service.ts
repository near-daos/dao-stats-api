import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStats, DaoStatsDto, DaoStatsMetric } from '.';

export interface DaoStatsValueParams {
  contractId: string;
  dao?: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  daoAverage?: boolean;
}

export interface DaoStatsLeaderboardParams {
  contractId: string;
  dao?: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  limit?: number;
}

export interface DaoStatsLeaderboard {
  dao: string;
  value: number;
}

export type DaoStatsLeaderboardResponse = DaoStatsLeaderboard[];

@Injectable()
export class DaoStatsService {
  constructor(
    @InjectRepository(DaoStats)
    private readonly repository: Repository<DaoStats>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DaoStatsDto): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStats)
      .values(data)
      .orUpdate({
        conflict_target: ['contract_id', 'dao', 'metric'],
        overwrite: ['value'],
      })
      .execute();
  }

  async getValue({
    contractId,
    dao,
    metric,
    daoAverage,
  }: DaoStatsValueParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`sum(value) as value`);

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

    query.groupBy('dao');

    const [subQuery, params] = query.getQueryAndParameters();

    const [result] = await this.connection.query(
      `
          with data as (${subQuery})
          select ${daoAverage ? 'avg' : 'sum'}(value) as value
          from data`,
      params,
    );

    if (!result || !result['value']) {
      return 0;
    }

    return parseFloat(result['value']);
  }

  async getLeaderboard({
    contractId,
    dao,
    metric,
    limit = 10,
  }: DaoStatsLeaderboardParams): Promise<DaoStatsLeaderboardResponse> {
    const query = this.repository
      .createQueryBuilder()
      .select(`dao, sum(value) as value`)
      .where('contract_id = :contractId', { contractId });

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

    const result = await query
      .groupBy('dao')
      .orderBy('value', 'DESC')
      .take(limit)
      .execute();

    return result.map(({ dao, value }) => ({
      dao,
      value: parseFloat(value),
    }));
  }
}
