import { millisToNanos } from '@dao-stats/astro/utils';
import { Transaction } from '@dao-stats/common/entities';
import { Aggregator } from '@dao-stats/common/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import PromisePool from '@supercharge/promise-pool';
import { TransactionService } from 'libs/transaction/src';
import { DAOStatsService } from '@dao-stats/common/dao-stats.service';
import { DAOStatsHistoryService } from '@dao-stats/common/dao-stats-history.service';

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lazyModuleLoader: LazyModuleLoader,
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DAOStatsService,
    private readonly daoStatsHistoryService: DAOStatsHistoryService,
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

      const { transactions, metrics } = await aggregationService.aggregate(
        contractId,
        from,
        to,
      );

      this.logger.log(
        `Persisting aggregated Transactions: ${transactions.length}`,
      );
      await PromisePool.withConcurrency(500)
        .for(transactions)
        .handleError((error) => {
          this.logger.error(error);
        })
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

      await PromisePool.withConcurrency(500)
        .for(metrics)
        .handleError((error) => {
          this.logger.error(error);
        })
        .process(async (metric) => {
          await this.daoStatsService.createOrUpdate(metric);
          await this.daoStatsHistoryService.createOrUpdate(metric);
        });

      this.logger.log(`Successfully stored aggregated metrics`);
    }
  }
}
