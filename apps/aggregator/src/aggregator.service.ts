import moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import PromisePool from '@supercharge/promise-pool';
import {
  Aggregator,
  DaoService,
  DaoStatsService,
  DaoStatsHistoryService,
  millisToNanos,
  nanosToMillis,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { CacheService } from '@dao-stats/cache';

const FIRST_BLOCK_TIMESTAMP = BigInt('1622560541482025354'); // first astro TX

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lazyModuleLoader: LazyModuleLoader,
    private readonly transactionService: TransactionService,
    private readonly daoService: DaoService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {
    const { pollingInterval } = this.configService.get('aggregator');

    const interval = setInterval(
      () => this.scheduleAggregation(),
      pollingInterval,
    );
    schedulerRegistry.addInterval('polling', interval);
  }

  public async scheduleAggregation(from?: bigint, to?: bigint): Promise<void> {
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

      if (!from) {
        const lastTx = await this.transactionService.lastTransaction(
          contractId,
        );

        if (lastTx) {
          this.logger.log(
            `Found last transaction: ${moment(
              nanosToMillis(lastTx.blockTimestamp),
            )}`,
          );
        }

        from = lastTx?.blockTimestamp || FIRST_BLOCK_TIMESTAMP;
      }

      if (!to) {
        to = millisToNanos(moment().valueOf());
      }

      for await (const transactions of aggregationService.aggregateTransactions(
        from,
        to,
      )) {
        await this.transactionService.create(
          transactions.map((tx) => ({
            ...tx,
            contractId,
            receipts: tx.receipts.map((receipt) => ({
              ...receipt,
              contractId,
              receiptActions: receipt.receiptActions.map((receiptAction) => ({
                ...receiptAction,
                contractId,
                argsJson: receiptAction.args,
                includedInBlockTimestamp: receipt.includedInBlockTimestamp,
              })),
            })),
          })),
        );

        this.logger.log(`Stored ${transactions.length} transaction(s)`);
      }

      for await (const metrics of aggregationService.aggregateMetrics(
        contractId,
      )) {
        await this.daoService.create([
          {
            dao: metrics[0].dao,
            contractId,
          },
        ]);

        await PromisePool.withConcurrency(500)
          .for(metrics)
          .handleError((error) => {
            throw error;
          })
          .process(async (metric) => {
            await this.daoStatsService.createOrUpdate(metric);
            await this.daoStatsHistoryService.createOrUpdate(metric);
          });

        this.logger.log(`Stored ${metrics.length} metric(s)`);
      }
    }

    await this.cacheService.clearCache();
  }
}
