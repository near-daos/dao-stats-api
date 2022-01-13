import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStats, DaoStatsDto, DaoStatsMetric } from '.';

export interface DaoStatsTotalParams {
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
  total: number;
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
        conflict_target: ['contract_id', 'metric', 'dao'],
        overwrite: ['total', 'updated_at'],
      })
      .execute();
  }

  async getTotal({
    contractId,
    dao,
    metric,
    daoAverage,
  }: DaoStatsTotalParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`sum(total) as total`);

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

    query.groupBy('dao');

    const [subQuery, params] = query.getQueryAndParameters();

    const [result] = await this.connection.query(
      `
          with data as (${subQuery})
          select ${daoAverage ? 'avg' : 'sum'}(total) as total
          from data`,
      params,
    );

    if (result) {
      return parseFloat(result.total);
    }

    return 0;
  }

  async getLeaderboard({
    contractId,
    dao,
    metric,
    limit = 10,
  }: DaoStatsLeaderboardParams): Promise<DaoStatsLeaderboardResponse> {
    const query = this.repository
      .createQueryBuilder()
      .select(`dao, sum(total) as total`)
      .where('contract_id = :contractId', { contractId });

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

    const result = await query
      .groupBy('dao')
      .orderBy('total', 'DESC')
      .take(limit)
      .execute();

    return result.map(({ dao, total }) => ({
      dao,
      total: parseFloat(total),
    }));
  }
}
