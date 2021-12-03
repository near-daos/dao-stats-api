import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { ContractContext, DaoContractContext } from './dto';
import { DaoStatsAggregationFunction, DaoStatsMetric } from './types';
import { DaoStats } from './entities';

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

  async getAggregationValue(
    context: ContractContext | DaoContractContext,
    func: DaoStatsAggregationFunction,
    metric: DaoStatsMetric,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

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
