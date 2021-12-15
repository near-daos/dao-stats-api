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

@Injectable()
export class ReceiptActionService {
  private readonly logger = new Logger(ReceiptActionService.name);

  constructor(
    @InjectRepository(ReceiptAction)
    private readonly receiptRepository: Repository<ReceiptAction>,
  ) {}

  async getTransfers(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<number> {
    return this.getTransferIntervalQueryBuilder(
      context,
      transferType,
      metricQuery,
    ).getCount();
  }

  async getTransfersHistory(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    return this.getTransferIntervalQueryBuilder(
      context,
      transferType,
      metricQuery,
      true,
    )
      .addSelect(`count(*)::int as count`, '')
      .execute();
  }

  async getFunds(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<{ count: number }> {
    return this.getTransferIntervalQueryBuilder(
      context,
      transferType,
      metricQuery,
    )
      .select(`sum((args_json->>'deposit')::numeric) as count`, '')
      .getRawOne();
  }

  async getFundsHistory(
    context: DaoContractContext,
    transferType?: TransferType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    return this.getTransferIntervalQueryBuilder(
      context,
      transferType,
      metricQuery,
      true,
    )
      .addSelect(`sum((args_json->>'deposit')::numeric) as count`, '')
      .execute();
  }

  private getTransferIntervalQueryBuilder(
    context: DaoContractContext,
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

    if (daily) {
      qb.select(
        `date_trunc('day', to_timestamp(included_in_block_timestamp / 1000 / 1000 / 1000)) as day`,
      )
        .groupBy('day')
        .orderBy('day', 'ASC');
    }

    return qb;
  }
}
