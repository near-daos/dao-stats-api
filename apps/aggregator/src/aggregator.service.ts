import moment from 'moment';
import { CronJob } from 'cron';
import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  Aggregator,
  AGGREGATOR_POLLING_CRON_JOB,
  CoinPriceHistoryService,
  ContractService,
  CurrencyType,
  DaoService,
  DaoStatsHistoryService,
  DaoStatsService,
  millisToNanos,
  nanosToMillis,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { CacheService } from '@dao-stats/cache';
import { ReceiptActionService } from '@dao-stats/receipt';
import { CoinGeckoService, SodakiService } from '@dao-stats/exchange';

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);
  private running = false;

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
    private readonly contractService: ContractService,
    private readonly sodakiService: SodakiService,
    private readonly coinGeckoService: CoinGeckoService,
    private readonly coinPriceHistoryService: CoinPriceHistoryService,
  ) {
    const { pollingSchedule } = this.configService.get('aggregator');

    const job = new CronJob(pollingSchedule, () => this.scheduleAggregation());

    this.schedulerRegistry.addCronJob(AGGREGATOR_POLLING_CRON_JOB, job);

    job.start();
  }

  public async scheduleAggregation(from?: bigint, to?: bigint): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    const contracts = await this.contractService.find();

    for (const contract of contracts) {
      const { contractId, coin } = contract;

      this.logger.log(`Processing contract: ${contractId}...`);

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

      const daos = [];
      for await (const dao of aggregationService.aggregateDaos(contractId)) {
        await this.daoService.create(dao);

        daos.push(dao);
      }

      this.logger.log(`Stored ${daos.length} DAO(s)`);

      // Purging DAOs that were removed from contract
      const { affected } = await this.daoService.purgeInactive(
        contractId,
        daos.map(({ dao }) => dao),
      );

      if (affected) {
        this.logger.log(`Purged ${affected} inactive DAO(s)`);
      }

      for await (const metric of aggregationService.aggregateMetrics(
        contractId,
      )) {
        await this.daoStatsService.createOrUpdate(metric);
        await this.daoStatsHistoryService.createOrUpdate(metric);
      }

      this.logger.log(
        `Retrieving current market price for contract: ${contractId}`,
      );

      for (const currency in CurrencyType) {
        let price: number;

        try {
          price = await this.sodakiService.getCoinSpotPrice(
            coin,
            CurrencyType[currency],
          );
        } catch (e) {
          this.logger.warn(e);

          this.logger.log(
            'Unable to get market price from Sodaki. Switching to CoinGecko for another try.',
          );

          price = await this.coinGeckoService.getCoinPrice(
            coin,
            CurrencyType[currency],
          );
        }

        await this.coinPriceHistoryService.createOrUpdate({
          coin,
          currency: CurrencyType[currency],
          price,
        });

        this.logger.log(`Stored market price for ${coin}: ${price}${currency}`);
      }

      this.logger.log(`Finished processing contract: ${contractId}`);
    }

    await this.cacheService.clearCache();

    this.running = false;
  }
}
