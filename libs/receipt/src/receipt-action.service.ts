import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  DailyCountDto,
  MetricQuery,
  millisToNanos,
  ReceiptAction,
} from '@dao-stats/common';
import { TransferType } from './types/transfer-type';
import { FlowMetricType } from './types/flow-metric-type';
import { ContractContextService } from 'apps/api/src/context/contract-context.service';

@Injectable()
export class ReceiptActionService extends ContractContextService {
  private readonly logger = new Logger(ReceiptActionService.name);

  constructor(
    @InjectRepository(ReceiptAction)
    private readonly receiptRepository: Repository<ReceiptAction>,
  ) {
    super();
  }

  async getTotals(
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<{ count: number }> {
    return this.getTransferIntervalQueryBuilder(
      metricType,
      transferType,
      metricQuery,
    ).getRawOne();
  }

  async getHistory(
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    return this.getTransferIntervalQueryBuilder(
      metricType,
      transferType,
      metricQuery,
      true,
    ).execute();
  }

  async getLeaderboard(
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    const qb = this.getTransferIntervalQueryBuilder(
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
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<{ count: number }> {
    return this.getFundsQueryBuilder(transferType, metricQuery).getRawOne();
  }

  async getFundsHistory(
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    return this.getFundsQueryBuilder(transferType, metricQuery, true).execute();
  }

  async getFundsLeaderboard(
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    const qb = this.getFundsQueryBuilder(transferType, metricQuery, daily)
      .addSelect('receipt_receiver_account_id', 'receiver_account_id')
      .addGroupBy('receiver_account_id')
      .addOrderBy('count', 'DESC');

    if (!daily) {
      qb.limit(10);
    }

    return qb.execute();
  }

  private getFundsQueryBuilder(
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ) {
    const qb = this.getTransferIntervalQueryBuilder(
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
    metricType: FlowMetricType,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): SelectQueryBuilder<ReceiptAction> {
    const { contract, dao } = this.getContext();
    const { contractId, contractName } = contract;
    const { from, to } = metricQuery || {};

    const qb = this.receiptRepository
      .createQueryBuilder()
      .where('contract_id = :contractId', { contractId })
      .andWhere(`args_json->>'deposit' is not null`);

    if (transferType) {
      qb.andWhere(
        `receipt_${
          transferType === TransferType.Incoming ? 'receiver' : 'predecessor'
        }_account_id ${dao ? `= '${dao}'` : `like '%${contractName}%'`}`,
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
