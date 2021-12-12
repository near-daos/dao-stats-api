import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PromisePool from '@supercharge/promise-pool';
import {
  findAllByKey,
  Transaction,
  TransactionType,
  VoteType,
} from '@dao-stats/common';
import { Migration } from '..';

@Injectable()
export class TransactionProposalVoteMigration implements Migration {
  private readonly logger = new Logger(TransactionProposalVoteMigration.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  public async migrate(): Promise<void> {
    this.logger.log('Starting Transaction Proposal Vote Type migration...');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.receipts', 'receipts')
      .leftJoinAndSelect('receipts.receiptActions', 'action_receipt_actions')
      .where('type = :type', { type: TransactionType.ActProposal })
      .andWhere('vote_type is null')
      .getMany();

    const updated = transactions.map((tx) => ({
      ...tx,
      voteType: this.getVoteType(tx),
    }));

    this.logger.log(
      `Updating Transactions: ${updated.filter((tx) => tx.voteType).length}`,
    );

    await PromisePool.withConcurrency(500)
      .for(updated)
      .handleError((error) => {
        this.logger.error(error);
      })
      .process(async (tx) => {
        await this.transactionRepository.save(tx);
      });

    this.logger.log('Finished Transaction Proposal Vote Type migration.');
  }

  private getVoteType(tx: Transaction): VoteType {
    const actions = findAllByKey(tx, 'action');

    return actions.includes('VoteApprove')
      ? VoteType.VoteApprove
      : actions.includes('VoteReject')
      ? VoteType.VoteReject
      : null;
  }
}
