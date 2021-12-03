import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStatsHistory } from './entities';
import { ContractContext, DaoContractContext } from './dto';
import { DaoStatsAggregationFunction, DaoStatsMetric } from './types';
import { DaoStatsHistoryResult } from './interfaces';

@Injectable()
export class DaoStatsHistoryService {
  constructor(
    @InjectRepository(DaoStatsHistory)
    private readonly repository: Repository<DaoStatsHistory>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DaoStatsHistory): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStatsHistory)
      .values(data)
      .orUpdate({
        conflict_target: ['date', 'contract_id', 'dao', 'metric'],
        overwrite: ['value'],
      })
      .execute();
  }

  async getAggregationValue(
    context: ContractContext | DaoContractContext,
    func: DaoStatsAggregationFunction,
    metric: DaoStatsMetric,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    const query = this.repository
      .createQueryBuilder()
      .select(`${func}(value) as value`);

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

  async getHistory(
    contract: string,
    func: DaoStatsAggregationFunction,
    metric: DaoStatsMetric,
    from?: number,
    to?: number,
  ): Promise<DaoStatsHistoryResult[]> {
    const query = this.repository
      .createQueryBuilder()
      .select(`date, ${func}(value) as value`);

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

    query.andWhere('contract_id = :contract', { contract });

    return query
      .andWhere('metric = :metric', { metric })
      .groupBy('date')
      .orderBy('date', 'DESC')
      .execute();
  }
}
