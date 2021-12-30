import moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
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
import { ReceiptActionService } from '@dao-stats/receipt';

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lazyModuleLoader: LazyModuleLoader,
    private readonly transactionService: TransactionService,
    private readonly receiptActionService: ReceiptActionService,
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

        from = lastTx?.blockTimestamp;
      }

      if (!to) {
        to = millisToNanos(moment().valueOf());
      }

      for await (const receiptActions of aggregationService.aggregateReceiptActions(
        from,
        to,
      )) {
        await this.receiptActionService.create(
          receiptActions.flat().map((receiptAction) => ({
            ...receiptAction,
            includedInBlockTimestamp:
              receiptAction.receiptIncludedInBlockTimestamp,
            contractId,
            argsJson: receiptAction.args,
            receipt: {
              ...receiptAction.receipt,
              receiptActions: [],
              contractId,
              originatedFromTransaction: {
                ...receiptAction.receipt.originatedFromTransaction,
                contractId,
              },
            },
          })),
        );

        this.logger.log(`Stored ${receiptActions.length} receipt action(s)`);
      }

      const daos = await aggregationService.getDaos(contractId);

      await this.daoService.create(daos);

      this.logger.log(`Stored ${daos.length} DAO(s)`);

      for await (const metric of aggregationService.aggregateMetrics(
        contractId,
      )) {
        await this.daoStatsService.createOrUpdate(metric);
        await this.daoStatsHistoryService.createOrUpdate(metric);
      }
    }

    await this.cacheService.clearCache();
  }
}
