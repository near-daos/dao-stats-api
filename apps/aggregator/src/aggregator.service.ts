import { millisToNanos } from '@dao-stats/astro/utils';
import { Transaction } from '@dao-stats/common/entities/transaction.entity';
import { Aggregator } from '@dao-stats/common/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import PromisePool from '@supercharge/promise-pool';
import { TransactionService } from 'libs/transaction/src';

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lazyModuleLoader: LazyModuleLoader,
    private readonly transactionService: TransactionService,
  ) {
    const { pollingInterval } = this.configService.get('aggregator');

    const interval = setInterval(
      () => this.scheduleAggregation(),
      pollingInterval,
    );
    schedulerRegistry.addInterval('polling', interval);
  }

  public async scheduleAggregation(): Promise<void> {
    const { smartContracts } = this.configService.get('aggregator');

    for (const contractId of smartContracts) {
      const { AggregationModule, AggregationService } = await import(
        '../../../libs/' + contractId + '/'
      );
      const moduleRef = await this.lazyModuleLoader.load(
        () => AggregationModule,
      );

      const aggregationService = moduleRef.get(
        AggregationService,
      ) as Aggregator;

      const lastTx: Transaction = await this.transactionService.lastTransaction(
        contractId,
      );

      const today = new Date();
      const yearAgo = new Date(today.getFullYear() - 1, today.getMonth());

      const from = lastTx?.blockTimestamp || millisToNanos(yearAgo.getTime());
      const to = millisToNanos(new Date().getTime());

      const { transactions } = await aggregationService.aggregate(from, to);

      this.logger.log(
        `Persisting aggregated Transactions: ${transactions.length}`,
      );
      const { results, errors } = await PromisePool.withConcurrency(500)
        .for(transactions)
        .process(
          async (tx) =>
            await this.transactionService.create([
              {
                ...tx,
                contractId,
                receipts: tx.receipts.map((receipt) => ({
                  ...receipt,
                  contractId,
                  receiptActions: receipt.receiptActions.map(
                    (receiptAction) => ({
                      ...receiptAction,
                      contractId,
                    }),
                  ),
                })),
              },
            ]),
        );
      this.logger.log(`Successfully stored aggregated Transactions`);

      if (errors && errors.length) {
        errors.map((error) => this.logger.error(error));
      }
    }
  }
}
