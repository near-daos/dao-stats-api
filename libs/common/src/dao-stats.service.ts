import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStats } from './entities';

interface DaoStatsParams {
  contract: string;
  dao?: string;
  metric: string;
  func?: 'AVG' | 'SUM' | 'COUNT';
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
    metric,
    dao,
    func = 'SUM',
  }: DaoStatsParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder()
      .select(`${func}(value) as value`)
      .where('contract_id = :contract', { contract });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    query.andWhere('metric = :metric', { metric });

    const result = await query.getRawOne();

    if (!result || !result['value']) {
      return 0;
    }

    return parseInt(result['value']);
  }
}
