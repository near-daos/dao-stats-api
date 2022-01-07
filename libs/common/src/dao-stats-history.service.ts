import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DaoStatsDto } from './dto';
import { DaoStatsHistory } from './entities';
import { DaoStatsAggregateFunction, DaoStatsMetric } from './types';

export interface DaoStatsHistoryValueParams {
  from?: number;
  to?: number;
  contractId: string;
  dao?: string;
  metric: DaoStatsMetric | DaoStatsMetric[];
  func?: DaoStatsAggregateFunction;
}

export type DaoStatsHistoryHistoryParams = DaoStatsHistoryValueParams;

export interface DaoStatsHistoryHistoryResponse {
  date: Date;
  value: number;
}

@Injectable()
export class DaoStatsHistoryService {
  constructor(
    @InjectRepository(DaoStatsHistory)
    private readonly repository: Repository<DaoStatsHistory>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DaoStatsDto): Promise<InsertResult> {
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

  async createIgnore(data: DaoStatsDto): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DaoStatsHistory)
      .values(data)
      .onConflict('DO NOTHING')
      .execute();
  }

  async getLastValue({
    contractId,
    dao,
    metric,
    func = DaoStatsAggregateFunction.Sum,
    from,
    to,
  }: DaoStatsHistoryValueParams): Promise<number> {
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

    query.andWhere('contract_id = :contractId', { contractId });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    if (Array.isArray(metric)) {
      query.andWhere('metric IN (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    const [result] = await query
      .groupBy('date')
      .orderBy('date', 'DESC')
      .take(1)
      .execute();

    if (!result || !result['value']) {
      return 0;
    }

    return parseFloat(result['value']);
  }

  async getHistory({
    contractId,
    dao,
    metric,
    func = DaoStatsAggregateFunction.Sum,
    from,
    to,
  }: DaoStatsHistoryHistoryParams): Promise<DaoStatsHistoryHistoryResponse[]> {
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

    query.andWhere('contract_id = :contractId', { contractId });

    if (dao) {
      query.andWhere('dao = :dao', { dao });
    }

    if (Array.isArray(metric)) {
      query.andWhere('metric IN (:...metric)', { metric });
    } else {
      query.andWhere('metric = :metric', { metric });
    }

    const result = await query.groupBy('date').orderBy('date', 'ASC').execute();

    return result.map((data) => ({ ...data, value: parseFloat(data.value) }));
  }
}
