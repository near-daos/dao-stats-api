import moment from 'moment';
import Decimal from 'decimal.js';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import {
  Aggregator,
  DaoDto,
  DaoStatsDto,
  DaoStatsHistoryDto,
  decodeBase64,
  findAllByKey,
  millisToNanos,
  nanosToMillis,
  ReceiptActionDto,
  ReceiptDto,
  TransactionType,
  VoteType,
} from '@dao-stats/common';
import { NearIndexerService, ReceiptAction } from '@dao-stats/near-indexer';
import { AstroService } from './astro.service';
import {
  DAO_HISTORICAL_METRICS,
  DAO_METRICS,
  FACTORY_HISTORICAL_METRICS,
  FACTORY_METRICS,
} from './metrics';

const FIRST_BLOCK_TIMESTAMP = BigInt('1622560541482025354'); // first astro TX
const RETRY_COUNT_THRESHOLD = 10;

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly astroService: AstroService,
    private readonly configService: ConfigService,
    private readonly nearIndexerService: NearIndexerService,
  ) {}

  /**
   * TODO remove transaction collection logic when all transaction queries are converted to dao stats.
   * @deprecated
   */
  async *aggregateReceiptActions(
    fromTimestamp?: bigint | null,
    toTimestamp?: bigint,
  ): AsyncGenerator<ReceiptActionDto[]> {
    const { contractName } = this.configService.get('dao');

    const chunkSize = millisToNanos(12 * 60 * 60 * 1000); // 12 hours

    let from = fromTimestamp || FIRST_BLOCK_TIMESTAMP;

    this.logger.log('Starting aggregating Astro transactions...');

    let retryCount = 0;
    while (true) {
      const to = BigInt(
        Decimal.min(String(from + chunkSize), String(toTimestamp)).toString(),
      );

      this.logger.log(
        `Querying receipt actions from: ${moment(
          nanosToMillis(from),
        )} to: ${moment(nanosToMillis(to))}...`,
      );

      let receiptActions: ReceiptAction[] = [];
      try {
        receiptActions = await this.nearIndexerService
          .buildAggregationReceiptActionQuery(contractName, from, to)
          .getMany();

        retryCount = 0;
      } catch (e) {
        this.logger.error(e);

        if (retryCount <= RETRY_COUNT_THRESHOLD) {
          ++retryCount;

          this.logger.log(
            `#${retryCount} - Retrying action receipts retrieval from: ${moment(
              nanosToMillis(from),
            )} to: ${moment(nanosToMillis(to))}...`,
          );

          await new Promise((f) => setTimeout(f, 5000));

          continue;
        }

        this.logger.warn(
          `Reached MAX attempts count ${RETRY_COUNT_THRESHOLD} for request from: ${moment(
            nanosToMillis(from),
          )} to: ${moment(nanosToMillis(to))}`,
        );

        retryCount = 0;
      }

      if (receiptActions.length) {
        yield receiptActions.map((receiptAction) => ({
          ...receiptAction,
          receipt: {
            ...(receiptAction.receipt as unknown as ReceiptDto),
            originatedFromTransaction: {
              ...receiptAction.receipt.originatedFromTransaction,
              type: this.getTransactionType(receiptAction),
              voteType: this.getVoteType(receiptAction),
            },
          },
        }));
      }

      if (to >= toTimestamp) {
        break;
      }

      from = to;
    }

    this.logger.log('Finished aggregating Astro transactions.');
  }

  // TODO: a raw casting - revisit this
  private getTransactionType(receiptAction: ReceiptAction): TransactionType {
    const methods = findAllByKey(receiptAction, 'method_name');

    return methods.includes('create')
      ? TransactionType.CreateDao
      : methods.includes('add_proposal')
      ? TransactionType.AddProposal
      : methods.includes('act_proposal')
      ? TransactionType.ActProposal
      : null;
  }

  private getVoteType(receiptAction: ReceiptAction): VoteType {
    const actions = findAllByKey(receiptAction, 'action');

    return actions.includes('VoteApprove')
      ? VoteType.VoteApprove
      : actions.includes('VoteReject')
      ? VoteType.VoteReject
      : null;
  }

  async *aggregateDaos(contractId: string): AsyncGenerator<DaoDto> {
    const daoContracts = await this.astroService.getDaoContracts();

    this.logger.log('Staring aggregating Astro DAOs...');

    for (const daoContract of daoContracts.values()) {
      let metadata: any;
      try {
        const config = await daoContract.getConfig();

        metadata = JSON.parse(decodeBase64(config.metadata));
      } catch (err) {
        if ('SyntaxError' !== err.name) {
          this.logger.error(
            `Aggregation error for contract "${daoContract.contractId}" entity: ${err}`,
          );
        }
      }

      yield {
        dao: daoContract.contractId,
        metadata,
        contractId,
      };
    }
  }

  async *aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto> {
    const { contractName } = this.configService.get('dao');

    this.logger.log('Staring aggregating Astro metrics...');

    const factoryContract = await this.astroService.getDaoFactoryContract();

    for (const metricClass of FACTORY_METRICS) {
      const metric = await this.moduleRef.create(metricClass);
      const type = metric.getType();
      let value;

      try {
        value = await metric.getCurrentValue({
          contract: factoryContract,
        });
      } catch (err) {
        this.logger.error(
          `Aggregation error for DAO factory "${contractName}", metric "${type}": ${err}`,
        );
        continue;
      }

      this.logger.log(
        `Aggregated DAO Factory (${contractName}) metric (${type}): ${value}`,
      );

      yield {
        contractId,
        dao: contractName, // TODO: make optional
        metric: type,
        value,
      };
    }

    const daoContracts = await this.astroService.getDaoContracts();

    const daoMetrics = DAO_METRICS.map((metricClass) =>
      this.moduleRef.get(metricClass),
    );

    for (const [i, daoContract] of daoContracts.entries()) {
      for (const metric of daoMetrics) {
        const type = metric.getType();
        let value;

        try {
          value = await metric.getCurrentValue({
            contract: daoContract,
          });
        } catch (err) {
          this.logger.error(
            `Aggregation error for contract "${daoContract.contractId}", metric "${type}": ${err}`,
          );
          continue;
        }

        this.logger.log(
          `Aggregated (${i + 1}/${daoContracts.length}) DAO (${
            daoContract.contractId
          }) metric (${type}): ${value}`,
        );

        yield {
          contractId,
          dao: daoContract.contractId,
          metric: type,
          value,
        };
      }
    }

    this.logger.log('Finished aggregating Astro metrics.');
  }

  async *aggregateHistoricalMetrics(
    contractId: string,
  ): AsyncGenerator<DaoStatsHistoryDto> {
    const { contractName } = this.configService.get('dao');

    this.logger.log('Staring aggregating Astro historical metrics...');

    const factoryContract = await this.astroService.getDaoFactoryContract();

    for (const metricClass of FACTORY_HISTORICAL_METRICS) {
      const metric = await this.moduleRef.create(metricClass);
      const type = metric.getType();
      let data;

      try {
        data = await metric.getHistoricalValues({
          contract: factoryContract,
        });
      } catch (err) {
        this.logger.error(
          `Aggregation error for DAO factory "${contractName}", metric "${type}": ${err}`,
        );
        continue;
      }

      for (const { date, value } of data) {
        this.logger.log(
          `Aggregated DAO Factory (${contractName}) metric (${type}) for date (${date}): ${value}`,
        );

        yield {
          date,
          contractId,
          dao: contractName, // TODO: make optional
          metric: type,
          value,
        };
      }
    }

    const daoContracts = await this.astroService.getDaoContracts();

    const daoHistoricalMetrics = DAO_HISTORICAL_METRICS.map((metricClass) =>
      this.moduleRef.get(metricClass),
    );

    for (const [i, daoContract] of daoContracts.entries()) {
      for (const metric of daoHistoricalMetrics) {
        const type = metric.getType();
        let data;

        try {
          data = await metric.getHistoricalValues({
            contract: daoContract,
          });
        } catch (err) {
          this.logger.error(
            `Aggregation error for contract "${daoContract.contractId}", metric "${type}": ${err}`,
          );
          continue;
        }

        for (const { date, value } of data) {
          this.logger.log(
            `Aggregated (${i + 1}/${daoContracts.length}) DAO (${
              daoContract.contractId
            }) metric (${type}) for date (${date}): ${value}`,
          );

          yield {
            date,
            contractId,
            dao: daoContract.contractId,
            metric: type,
            value,
          };
        }
      }
    }

    this.logger.log('Finished aggregating Astro historical metrics.');
  }
}
