import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  DailyCountDto,
  DaoContractContext,
  MetricQuery,
  ReceiptAction,
} from '@dao-stats/common';
import { TransferType } from './types/transfer-type';
import { FlowMetricType } from './types/flow-metric-type';

@Injectable()
export class ReceiptActionService {
  private readonly logger = new Logger(ReceiptActionService.name);

  constructor(
    @InjectRepository(ReceiptAction)
    private readonly receiptRepository: Repository<ReceiptAction>,
  ) {}

  async getTotals(
    context: DaoContractContext,
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
    context: DaoContractContext,
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
    context: DaoContractContext,
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
      .addSelect('receipt_receiver_account_id', 'receiver_account_id')
      .addGroupBy('receiver_account_id')
      .addOrderBy('count', 'DESC');

    if (!daily) {
      qb.limit(10);
    }

    return qb.execute();
  }

  async getFunds(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<{ count: number }> {
    return this.getFundsQueryBuilder(
      context,
      transferType,
      metricQuery,
    ).getRawOne();
  }

  async getFundsHistory(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    return this.getFundsQueryBuilder(
      context,
      transferType,
      metricQuery,
      true,
    ).execute();
  }

  async getFundsLeaderboard(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    const qb = this.getFundsQueryBuilder(
      context,
      transferType,
      metricQuery,
      daily,
    )
      .addSelect('receipt_receiver_account_id', 'receiver_account_id')
      .addGroupBy('receiver_account_id')
      .addOrderBy('count', 'DESC');

    if (!daily) {
      qb.limit(10);
    }

    return qb.execute();
  }

  private getFundsQueryBuilder(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ) {
    const qb = this.getTransferIntervalQueryBuilder(
      context,
      null,
      transferType,
      metricQuery,
      daily,
    );

    const selection = `sum((args_json->>'deposit')::numeric) as count`;
    if (daily) {
      qb.addSelect(selection);
    } else {
      qb.select(selection);
    }

    return qb;
  }

  private getTransferIntervalQueryBuilder(
    context: DaoContractContext,
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): SelectQueryBuilder<ReceiptAction> {
    const { contract, dao } = context;
    const { from, to } = metricQuery || {};

    const qb = this.receiptRepository
      .createQueryBuilder()
      .where('contract_id = :contract', { contract })
      .andWhere(`args_json->>'deposit' is not null`);

    if (transferType) {
      qb.andWhere(
        `receipt_${
          transferType === TransferType.Incoming ? 'receiver' : 'predecessor'
        }_account_id like :id`,
        {
          id: `%${dao}%`,
        },
      );
    }

    if (from) {
      qb.andWhere('(included_in_block_timestamp / 1000 / 1000) > :from', {
        from,
      });
    }

    if (to) {
      qb.andWhere('(included_in_block_timestamp / 1000 / 1000) < :to', { to });
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
