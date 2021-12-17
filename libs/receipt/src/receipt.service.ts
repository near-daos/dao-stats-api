import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  millisToNanos,
  Receipt,
} from '@dao-stats/common';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async findIncomingReceipts(
    context: DaoContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Receipt[]> {
    const { dao } = context;
    const { from, to } = metricQuery || {};

    return this.getReceiptIntervalQueryBuilder(context, from, to, true)
      .andWhere('action_receipt_actions.receipt_receiver_account_id like :id', {
        id: `%${dao}%`,
      })
      .getMany();
  }

  async findOutgoingReceipts(
    context: DaoContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Receipt[]> {
    const { dao } = context;
    const { from, to } = metricQuery || {};

    return this.getReceiptIntervalQueryBuilder(context, from, to, true)
      .andWhere(
        'action_receipt_actions.receipt_predecessor_account_id like :id',
        { id: `%${dao}%` },
      )
      .getMany();
  }

  async findReceipts(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Receipt[]> {
    const { contract } = context;
    const { from, to } = metricQuery || {};
    const queryBuilder = this.getReceiptIntervalQueryBuilder(
      context,
      from,
      to,
      true,
    );

    queryBuilder.andWhere(
      'action_receipt_actions.receipt_predecessor_account_id like :id',
      { id: `%${contract}%` },
    );

    return queryBuilder.getMany();
  }

  private getReceiptIntervalQueryBuilder(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
    eager?: boolean, // eagerly pulling all related data
  ): SelectQueryBuilder<Receipt> {
    const { contract } = context as DaoContractContext;

    const qb = this.receiptRepository.createQueryBuilder('receipt');

    if (eager) {
      qb.leftJoinAndSelect('receipt.receiptActions', 'action_receipt_actions');
    }

    qb.where('receipt.contract_id = :contract', { contract });

    // if (dao) {
    //   qb.andWhere('receiver_account_id = :dao', { dao });
    // }

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

    qb.orderBy('included_in_block_timestamp', 'ASC');

    return qb;
  }
}
