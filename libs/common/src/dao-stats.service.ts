import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStats } from './entities';
import { DaoStatsAggregateFunction, DaoStatsMetric } from './types';

export interface DaoStatsValueParams {
  contractId: string;
  dao?: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  func?: DaoStatsAggregateFunction;
}

export interface DaoStatsLeaderboardParams extends DaoStatsValueParams {
  limit?: number;
}

export interface DaoStatsLeaderboardResponse {
  dao: string;
  value: number;
}

@Injectable()
export class DaoStatsService {
  constructor(
    @InjectRepository(DaoStats)
    private readonly repository: Repository<DaoStats>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DaoStats): Promise<InsertResult> {
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
    func = DaoStatsAggregateFunction.Sum,
  }: DaoStatsValueParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`${func}(value) as value`);

    query.andWhere('contract_id = :contractId', { contractId });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    if (Array.isArray(metric)) {
      query.andWhere('metric IN (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    const [result] = await query.execute();

    if (!result || !result['value']) {
      return 0;
    }

    return parseFloat(result['value']);
  }

  async getLeaderboard({
    contractId,
    dao,
    metric,
    func = DaoStatsAggregateFunction.Sum,
    limit = 10,
  }: DaoStatsLeaderboardParams): Promise<DaoStatsLeaderboardResponse[]> {
    const query = this.repository
      .createQueryBuilder()
      .select(`dao, ${func}(value) as value`)
      .where('contract_id = :contractId', { contractId });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    if (Array.isArray(metric)) {
      query.andWhere('metric IN (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    const result = await query
      .groupBy('dao')
      .orderBy('value', 'DESC')
      .take(limit)
      .execute();

    return result.map((data) => ({ ...data, value: parseFloat(data.value) }));
  }
}
