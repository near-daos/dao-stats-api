import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStats } from './entities';
import { DaoStatsMetric } from '@dao-stats/common/types';

interface DaoStatsValueParams {
  contract: string;
  dao?: string;
  metric: DaoStatsMetric;
  func?: 'AVG' | 'SUM' | 'COUNT';
}

interface DaoStatsLeaderboardParams extends DaoStatsValueParams {
  limit?: number;
}

interface DaoStatsLeaderboardResponse {
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
    contract,
    dao,
    metric,
    func = 'SUM',
  }: DaoStatsValueParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`${func}(value) as value`);

    query.andWhere('contract_id = :contract', { contract });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    const [result] = await query
      .andWhere('metric = :metric', { metric })
      .take(1)
      .execute();

    if (!result || !result['value']) {
      return 0;
    }

    return parseInt(result['value']);
  }

  async getLeaderboard({
    contract,
    metric,
    dao,
    func = 'SUM',
    limit = 10,
  }: DaoStatsLeaderboardParams): Promise<DaoStatsLeaderboardResponse[]> {
    const query = this.repository
      .createQueryBuilder()
      .select(`dao, ${func}(value) as value`)
      .where('contract_id = :contract', { contract });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    const result = await query
      .andWhere('metric = :metric', { metric })
      .groupBy('dao')
      .orderBy('value', 'DESC')
      .take(limit)
      .execute();

    return result.map((row) => ({
      ...row,
      value: parseInt(row.value),
    }));
  }
}
