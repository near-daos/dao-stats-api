import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStatsHistory } from './entities';
import { DaoStatsMetric } from './types';
import { ContractContextService } from 'apps/api/src/context/contract-context.service';

export interface DaoStatsHistoryValueParams {
  from?: number;
  to?: number;
  dao?: string;
  metric: DaoStatsMetric;
  func?: 'AVG' | 'SUM' | 'COUNT';
}

export type DaoStatsHistoryHistoryParams = DaoStatsHistoryValueParams;

export interface DaoStatsHistoryHistoryResponse {
  date: Date;
  value: number;
}

@Injectable()
export class DaoStatsHistoryService extends ContractContextService {
  constructor(
    @InjectRepository(DaoStatsHistory)
    private readonly repository: Repository<DaoStatsHistory>,
    @InjectConnection()
    private connection: Connection,
  ) {
    super();
  }

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

  async getValue({
    from,
    to,
    dao,
    metric,
    func = 'SUM',
  }: DaoStatsHistoryValueParams): Promise<number> {
    const { contractId: contract } = this.getContext()?.contract;

    const query = this.repository
      .createQueryBuilder()
      .select(`${func}(value)::int as value`);

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

    const [result] = await query
      .andWhere('metric = :metric', { metric })
      .groupBy('date')
      .orderBy('date', 'DESC')
      .take(1)
      .execute();

    if (!result || !result['value']) {
      return 0;
    }

    return result['value'];
  }

  async getHistory({
    func = 'SUM',
    from,
    to,
    dao,
    metric,
  }: DaoStatsHistoryHistoryParams): Promise<DaoStatsHistoryHistoryResponse[]> {
    const { contractId: contract } = this.getContext()?.contract;

    const query = this.repository
      .createQueryBuilder()
      .select(`date, ${func}(value)::int as value`);

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

    return query
      .andWhere('metric = :metric', { metric })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .execute();
  }
}
