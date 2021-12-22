import moment from 'moment';
import Decimal from 'decimal.js';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import {
  Aggregator,
  DaoStatsDto,
  findAllByKey,
  millisToNanos,
  nanosToMillis,
  TransactionDto,
  TransactionType,
  VoteType,
} from '@dao-stats/common';
import { NearIndexerService, Transaction } from '@dao-stats/near-indexer';
import { AstroService } from './astro.service';
import { DAO_METRICS, FACTORY_METRICS } from './metrics';

const FIRST_BLOCK_TIMESTAMP = BigInt('1622560541482025354'); // first astro TX

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
  async *aggregateTransactions(
    fromTimestamp?: bigint | null,
    toTimestamp?: bigint,
  ): AsyncGenerator<TransactionDto[]> {
    const { contractName } = this.configService.get('dao');

    const chunkSize = millisToNanos(3 * 24 * 60 * 60 * 1000); // 3 days

    let from = fromTimestamp || FIRST_BLOCK_TIMESTAMP;

    this.logger.log('Starting aggregating Astro transactions...');

    while (true) {
      const to = BigInt(
        Decimal.min(String(from + chunkSize), String(toTimestamp)).toString(),
      );

      this.logger.log(
        `Querying transactions from: ${moment(
          nanosToMillis(from),
        )} to: ${moment(nanosToMillis(to))}...`,
      );

      const transactions =
        await this.nearIndexerService.findTransactionsByAccountIds(
          contractName,
          from,
          to,
        );

      if (transactions.length) {
        yield transactions.flat().map((tx) => ({
          ...tx,
          type: this.getTransactionType(tx),
          voteType: this.getVoteType(tx),
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

  private getVoteType(tx: Transaction): VoteType {
    const actions = findAllByKey(tx, 'action');

    return actions.includes('VoteApprove')
      ? VoteType.VoteApprove
      : actions.includes('VoteReject')
      ? VoteType.VoteReject
      : null;
  }

  async *aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto[]> {
    const { contractName } = this.configService.get('dao');

    this.logger.log('Staring aggregating Astro metrics...');

    const factoryContract = await this.astroService.getDaoFactoryContract();

    for (const metricClass of FACTORY_METRICS) {
      const metric = await this.moduleRef.create(metricClass);
      const type = metric.getType();
      const value = await metric.getCurrentValue({
        contract: factoryContract,
      });

      this.logger.log(
        `Aggregated DAO Factory (${contractName}) metric (${type}): ${value}`,
      );

      yield [
        {
          contractId,
          dao: contractName, // TODO: make optional
          metric: type,
          value,
        },
      ];
    }

    const daoContracts = await this.astroService.getDaoContracts();

    this.logger.log(`Received ${daoContracts.length} contract(s)`);

    for (const [i, daoContract] of daoContracts.entries()) {
      for (const metricClass of DAO_METRICS) {
        const metric = await this.moduleRef.create(metricClass);
        const type = metric.getType();
        const value = await metric.getCurrentValue({
          contract: daoContract,
        });

        this.logger.log(
          `Aggregated (${i + 1}/${daoContracts.length}) DAO (${
            daoContract.contractId
          }) metric (${type}): ${value}`,
        );

        yield [
          {
            contractId,
            dao: contractName,
            metric: type,
            value,
          },
        ];
      }
    }

    this.logger.log('Finished aggregating Astro metrics.');
  }
}
