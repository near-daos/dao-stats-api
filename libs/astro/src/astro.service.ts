import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import PromisePool from '@supercharge/promise-pool';

import {
  AggregationOutput,
  Aggregator,
  DAOStatsMetric,
  DAOStatsDto,
  TransactionDto,
  TransactionType,
} from '@dao-stats/common';
import { Transaction, NearIndexerService } from '@dao-stats/near-indexer';
import { AstroDAOService } from './astro-dao.service';
import { RoleGroup } from './types';
import {
  findAllByKey,
  isRoleGroup,
  isRoleGroupCouncil,
  millisToNanos,
} from './utils';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly nearIndexerService: NearIndexerService,
    private readonly astroDAOService: AstroDAOService,
  ) {}

  public async aggregate(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<AggregationOutput> {
    this.logger.log('Aggregating Astro DAO metrics...');

    const metrics = await this.aggregateMetrics(contractId);

    this.logger.log('Aggregating Astro DAO transactions...');

    const transactions = await this.aggregateTransactions(from, to);

    return { transactions, metrics };
  }

  private async aggregateTransactions(
    fromTimestamp?: number,
    toTimestamp?: number,
  ): Promise<TransactionDto[]> {
    const { contractName } = this.configService.get('dao');

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

    return transactions.flat().map((tx) => ({
      ...tx,
      type: this.getTransactionType(tx),
    }));
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

  private async aggregateMetrics(contractId): Promise<DAOStatsDto[]> {
    const contracts = await this.astroDAOService.getContracts();
    const { results } = await PromisePool.for(contracts)
      .withConcurrency(2)
      .process(async (contract) => {
        const policy = await contract.get_policy();
        const council = policy.roles.find(isRoleGroupCouncil);
        const councilSize = council
          ? (council.kind as RoleGroup).Group.length
          : 0;
        const groups = policy.roles.filter(isRoleGroup);
        return [
          {
            contractId,
            dao: contract.contractId,
            metric: DAOStatsMetric.CouncilSize,
            value: councilSize,
          },
          {
            contractId,
            dao: contract.contractId,
            metric: DAOStatsMetric.GroupsCount,
            value: groups.length,
          },
        ];
      });

    return results.flat();
  }
}
