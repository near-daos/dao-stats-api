import { Near } from 'near-api-js';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { NEAR_PROVIDER, NEAR_RPC_PROVIDER } from '@dao-stats/common';
import { AggregationOutput, Aggregator } from '@dao-stats/common/interfaces';
import { NearIndexerService } from '@dao-stats/near-indexer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
import PromisePool from '@supercharge/promise-pool';
import { findAllByKey, millisToNanos } from './utils';
import { TransactionType } from '@dao-stats/common/types/transaction-type';
import { Transaction } from './entities';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly nearIndexerService: NearIndexerService,
    @Inject(NEAR_PROVIDER)
    private readonly near: Near,
    @Inject(NEAR_RPC_PROVIDER)
    private readonly nearRPC: JsonRpcProvider,
  ) {}

  public async aggregate(
    fromTimestamp?: number,
    toTimestamp?: number,
  ): Promise<AggregationOutput> {
    this.logger.log('Aggregating Astro DAO...');

    const { contractName } = this.configService.get('near');

    const chunkSize = millisToNanos(5 * 24 * 60 * 60 * 1000); // 5 days
    const chunks = [];
    let from = fromTimestamp; //TODO: validation
    while (true) {
      const to = Math.min(Decimal.sum(from, chunkSize).toNumber(), toTimestamp);
      chunks.push({ from, to });

      if (to >= toTimestamp) {
        break;
      }

      from = to;
    }

    this.logger.log(`Querying for Near Indexer Transactions...`);
    const { results: transactions, errors: txErrors } =
      await PromisePool.withConcurrency(2)
        .for(chunks)
        .process(async ({ from, to }) => {
          return await this.nearIndexerService.findTransactionsByAccountIds(
            contractName,
            from,
            to,
          );
        });

    this.logger.log(
      `Received Total Transactions: ${
        transactions.flat().length
      }. Errors count: ${txErrors.length}`,
    );

    if (txErrors && txErrors.length) {
      txErrors.map((error) => this.logger.error(error));
    }

    return {
      transactions: transactions.flat().map((tx) => (
        {
          ...tx,
          type: this.getTransactionType(tx),
        }
      )),
    };
  }

  // TODO: a raw casting - revisit this
  private getTransactionType(tx: Transaction): TransactionType {
    const methods = findAllByKey(tx, 'method_name');

    return methods.includes('create')
      ? TransactionType.CreateDao
      : methods.includes('add_proposal')
      ? TransactionType.AddProposal
      : methods.includes('act_proposal')
      ? TransactionType.ActProposal
      : null;
  }
}
