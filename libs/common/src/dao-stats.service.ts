import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStats } from './entities';

interface DaoStatsLeaderboardParams {
  contract: string;
  dao?: string;
  metric: string;
  func?: 'AVG' | 'SUM' | 'COUNT';
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
