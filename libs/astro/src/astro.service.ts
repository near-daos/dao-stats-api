import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import PromisePool from '@supercharge/promise-pool';

import {
  AggregationOutput,
  Aggregator,
  DaoStatsDto,
  DaoStatsMetric,
  TransactionDto,
  TransactionType,
  millisToNanos,
  yoctoToPico,
  findAllByKey,
} from '@dao-stats/common';
import { NearIndexerService, Transaction } from '@dao-stats/near-indexer';
import { isRoleGroup, isRoleGroupCouncil } from './utils';
import {
  BountyResponse,
  ProposalKind,
  ProposalsResponse,
  ProposalStatus,
  RoleGroup,
} from './types';
import { AstroDaoService } from './astro-dao.service';
import { VoteType } from '@dao-stats/common/types/vote-type';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly nearIndexerService: NearIndexerService,
    private readonly astroDaoService: AstroDaoService,
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
      voteType: this.getVoteType(tx),
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

  private getVoteType(tx: Transaction): VoteType {
    const actions = findAllByKey(tx, 'action');

    return actions.includes('VoteApprove')
      ? VoteType.VoteApprove
      : actions.includes('VoteReject')
      ? VoteType.VoteReject
      : null;
  }

  private async aggregateMetrics(contractId): Promise<DaoStatsDto[]> {
    const { contractName } = this.configService.get('dao');

    const contracts = await this.astroDaoService.getContracts();

    const domainContractMetric = {
      contractId,
      dao: contractName,
      metric: DaoStatsMetric.DaoCount,
      value: contracts.length,
    };

    const { results } = await PromisePool.for(contracts)
      .withConcurrency(2)
      .handleError((error) => {
        this.logger.error(error);
      })
      .process(async (contract) => {
        const getProposals = async () => {
          const lastProposalId = await contract.get_last_proposal_id();
          const promises: Promise<ProposalsResponse>[] = [];
          for (let i = 0; i <= lastProposalId; i += 200) {
            promises.push(
              contract.get_proposals({ from_index: i, limit: 200 }),
            );
          }
          return (await Promise.all(promises)).flat();
        };

        const getBounties = async () => {
          const lastBountyId = await contract.get_last_bounty_id();
          const promises: Promise<BountyResponse>[] = [];
          for (let i = 0; i < lastBountyId; i += 200) {
            promises.push(contract.get_bounties({ from_index: i, limit: 200 }));
          }
          return (await Promise.all(promises)).flat();
        };

        const [policy, proposals, bounties] = await Promise.all([
          contract.get_policy(),
          getProposals(),
          getBounties(),
        ]);

        const council = policy.roles.find(isRoleGroupCouncil);
        const councilSize = council
          ? (council.kind as RoleGroup).Group.length
          : 0;
        const groups = policy.roles.filter(isRoleGroup);
        const payouts = proposals.filter(
          ({ kind }) => kind[ProposalKind.Transfer] !== undefined,
        );
        const councilMembers = proposals.filter((prop) => {
          const kind =
            prop.kind[ProposalKind.AddMemberToRole] ||
            prop.kind[ProposalKind.RemoveMemberFromRole];
          return kind ? kind.role.toLowerCase() === 'council' : false;
        });
        const policyChanges = proposals.filter(
          ({ kind }) => kind[ProposalKind.ChangePolicy] !== undefined,
        );
        const expiredProposals = proposals.filter(
          ({ status }) => status === ProposalStatus.Expired,
        );

        const common = {
          contractId,
          dao: contract.contractId,
        };

        return [
          {
            ...common,
            metric: DaoStatsMetric.CouncilSize,
            value: councilSize,
          },
          {
            ...common,
            metric: DaoStatsMetric.GroupsCount,
            value: groups.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.ProposalsCount,
            value: proposals.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.ProposalsPayoutCount,
            value: payouts.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.ProposalsCouncilMemberCount,
            value: councilMembers.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.ProposalsPolicyChangeCount,
            value: policyChanges.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.ProposalsExpiredCount,
            value: expiredProposals.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.BountiesCount,
            value: bounties.length,
          },
          {
            ...common,
            metric: DaoStatsMetric.BountiesValueLocked,
            value: bounties.reduce(
              (acc, bounty) =>
                // TODO confirm bounty VL formula
                acc + yoctoToPico(parseInt(bounty.amount) * bounty.times),
              0,
            ),
          },
        ];
      });

    return [domainContractMetric, ...results.flat()];
  }
}
