import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DAOStatsHistory } from './entities';
import { ContractContext, DaoContractContext } from '@dao-stats/common/dto';
import {
  DAOStatsAggregationFunction,
  DAOStatsMetric,
} from '@dao-stats/common/types';

@Injectable()
export class DAOStatsHistoryService {
  constructor(
    @InjectRepository(DAOStatsHistory)
    private readonly repository: Repository<DAOStatsHistory>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DAOStatsHistory): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DAOStatsHistory)
      .values(data)
      .orUpdate({
        conflict_target: ['date', 'contract_id', 'dao', 'metric'],
        overwrite: ['value'],
      })
      .execute();
  }

  async getAggregationValue(
    context: ContractContext | DaoContractContext,
    func: DAOStatsAggregationFunction,
    metric: DAOStatsMetric,
    fromTimestamp?: number,
    toTimestamp?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    const query = this.connection
      .getRepository(DAOStatsHistory)
      .createQueryBuilder()
      .select(`${func}(value) as value`);

    if (fromTimestamp) {
      query.andWhere('date >= to_timestamp(:timestamp)::date', {
        timestamp: fromTimestamp / 1000,
      });
    }

    if (toTimestamp) {
      query.andWhere('date <= to_timestamp(:timestamp)::date', {
        timestamp: toTimestamp / 1000,
      });
    }

    query.andWhere('contract_id = :contract', { contract });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    const result = await query
      .andWhere('metric = :metric', { metric })
      .groupBy('date')
      .orderBy('date', 'DESC')
      .take(1)
      .getRawOne();

    if (!result || !result['value']) {
      return 0;
    }

    return parseInt(result['value']);
  }
}
