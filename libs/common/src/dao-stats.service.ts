import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { ContractContext, DaoContractContext } from './dto';
import { DAOStatsAggregationFunction, DAOStatsMetric } from './types';
import { DAOStats } from './entities';

@Injectable()
export class DAOStatsService {
  constructor(
    @InjectRepository(DAOStats)
    private readonly repository: Repository<DAOStats>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DAOStats): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DAOStats)
      .values(data)
      .orUpdate({
        conflict_target: ['contract_id', 'dao', 'metric'],
        overwrite: ['value'],
      })
      .execute();
  }

  async getAggregationValue(
    context: ContractContext | DaoContractContext,
    func: DAOStatsAggregationFunction,
    metric: DAOStatsMetric,
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
