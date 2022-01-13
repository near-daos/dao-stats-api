import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ContractContext,
  DailyCountDto,
  DaoContractContext,
  MetricQuery,
  millisToNanos,
  ReceiptAction,
} from '@dao-stats/common';
import { TransferType } from './types/transfer-type';
import { FlowMetricType } from './types/flow-metric-type';

@Injectable()
export class ReceiptActionService {
  private readonly logger = new Logger(ReceiptActionService.name);

  constructor(
    @InjectRepository(ReceiptAction)
    private readonly receiptActionRepository: Repository<ReceiptAction>,
  ) {}

  create(actions: ReceiptAction[]): Promise<ReceiptAction[]> {
    return this.receiptActionRepository.save(actions);
  }

  async getTotals(
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<{ count: number }> {
    return this.getTransferIntervalQueryBuilder(
      context,
      metricType,
      transferType,
      metricQuery,
    ).getRawOne();
  }

  async getHistory(
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    return this.getTransferIntervalQueryBuilder(
      context,
      metricType,
      transferType,
      metricQuery,
      true,
    ).execute();
  }

  async getLeaderboard(
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    const qb = this.getTransferIntervalQueryBuilder(
      context,
      metricType,
      transferType,
      metricQuery,
      daily,
    )
      .addSelect(
        `receipt_${
          transferType === TransferType.Incoming ? 'receiver' : 'predecessor'
        }_account_id`,
        'account_id',
      )
      .addGroupBy('account_id')
      .addOrderBy('count', 'DESC');

    if (!daily) {
      qb.limit(10);
    }

    return qb.execute();
  }

  private getTransferIntervalQueryBuilder(
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): SelectQueryBuilder<ReceiptAction> {
    const { contract, dao } = context as DaoContractContext;
    const { contractId, contractName } = contract;
    const { from, to } = metricQuery || {};

    const qb = this.receiptActionRepository
      .createQueryBuilder()
      .where('contract_id = :contractId', { contractId })
      .andWhere(`args_json->>'deposit' is not null`);

    if (transferType) {
      qb.andWhere(
        `receipt_${
          transferType === TransferType.Incoming ? 'receiver' : 'predecessor'
        }_account_id ${dao ? `= '${dao}'` : `like '%.${contractName}'`}`,
      );
    }

    if (from) {
      qb.andWhere('included_in_block_timestamp >= :from', {
        from: String(millisToNanos(from)),
      });
    }

    if (to) {
      qb.andWhere('included_in_block_timestamp <= :to', {
        to: String(millisToNanos(to)),
      });
    }

    const baseSelection =
      metricType === FlowMetricType.Transaction
        ? `count(*)::int as count`
        : `sum((args_json->>'deposit')::numeric) as count`;

    qb.select(baseSelection);

    if (daily) {
      qb.select(
        `date_trunc('day', to_timestamp(included_in_block_timestamp / 1000 / 1000 / 1000)) as day`,
      )
        .addSelect(baseSelection)
        .groupBy('day')
        .orderBy('day', 'ASC');
    }

    return qb;
  }
}
