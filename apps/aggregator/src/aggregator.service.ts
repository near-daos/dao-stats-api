import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import PromisePool from '@supercharge/promise-pool';
import { RedisService } from 'libs/redis/src';
import moment from 'moment';
import { millisToNanos } from '@dao-stats/astro/utils';
import {
  Aggregator,
  Transaction,
  DAOStatsService,
  DAOStatsHistoryService,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';

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
    private readonly redisService: RedisService,
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

      const yearAgo = moment().subtract(1, 'year');

      const from = lastTx?.blockTimestamp || millisToNanos(yearAgo.valueOf());
      const to = millisToNanos(moment().valueOf());

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
