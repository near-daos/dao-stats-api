import moment from 'moment';
import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import {
  Aggregator,
  DaoStatsDto,
  DaoStatsMetric,
  TransactionDto,
  TransactionType,
  VoteType,
  millisToNanos,
  nanosToMillis,
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
  Role,
  RoleKindGroup,
} from './types';
import { AstroDaoService } from './astro-dao.service';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly nearIndexerService: NearIndexerService,
    private readonly astroDaoService: AstroDaoService,
  ) {}

  async *aggregateTransactions(
    fromTimestamp?: number,
    toTimestamp?: number,
  ): AsyncGenerator<TransactionDto[]> {
    const { contractName } = this.configService.get('dao');

    const chunkSize = millisToNanos(3 * 24 * 60 * 60 * 1000); // 3 days

    let from = fromTimestamp; //TODO: validation

    this.logger.log('Starting aggregating Astro transactions...');

    while (true) {
      const to = Math.min(Decimal.sum(from, chunkSize).toNumber(), toTimestamp);

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

    const contracts = await this.astroDaoService.getContracts();

    this.logger.log(`Received ${contracts.length} contract(s)`);

    yield [
      {
        contractId,
        dao: contractName,
        metric: DaoStatsMetric.DaoCount,
        value: contracts.length,
      },
    ];

    for (const [i, contract] of contracts.entries()) {
      this.logger.log(
        `Querying data for contract ${contract.contractId} (${i + 1}/${
          contracts.length
        })...`,
      );

      const getProposals = async () => {
        const lastProposalId = await contract.get_last_proposal_id();
        const promises: Promise<ProposalsResponse>[] = [];
        for (let i = 0; i <= lastProposalId; i += 200) {
          promises.push(contract.get_proposals({ from_index: i, limit: 200 }));
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

      let policy, proposals, bounties;

      try {
        [policy, proposals, bounties] = await Promise.all([
          contract.get_policy(),
          getProposals(),
          getBounties(),
        ]);
      } catch (err) {
        this.logger.error(err);
        continue;
      }

      const council = policy.roles.find(isRoleGroupCouncil) as
        | Role<RoleKindGroup>
        | undefined;
      const councilSize = council ? council.kind.Group.length : 0;
      const groups = policy.roles.filter(isRoleGroup);
      const members = [
        ...new Set(
          groups.map((group: Role<RoleKindGroup>) => group.kind.Group).flat(),
        ),
      ];
      const proposalsPayouts = proposals.filter(
        (prop) => prop.kind[ProposalKind.Transfer],
      );
      const proposalsBounties = proposals.filter(
        (prop) =>
          prop.kind[ProposalKind.AddBounty] ||
          prop.kind[ProposalKind.BountyDone],
      );
      const proposalsMembers = proposals.filter(
        (prop) =>
          prop.kind[ProposalKind.AddMemberToRole] ||
          prop.kind[ProposalKind.RemoveMemberFromRole],
      );
      const proposalsCouncilMembers = proposals.filter((prop) => {
        const kind =
          prop.kind[ProposalKind.AddMemberToRole] ||
          prop.kind[ProposalKind.RemoveMemberFromRole];
        return kind ? kind.role.toLowerCase() === 'council' : false;
      });
      const proposalsPolicyChanges = proposals.filter(
        ({ kind }) => kind[ProposalKind.ChangePolicy],
      );
      const proposalsInProgress = proposals.filter(
        ({ status }) => status === ProposalStatus.InProgress,
      );
      const proposalsApproved = proposals.filter(
        ({ status }) => status === ProposalStatus.Approved,
      );
      const proposalsRejected = proposals.filter(
        ({ status }) => status === ProposalStatus.Rejected,
      );
      const proposalsExpired = proposals.filter(
        ({ status }) => status === ProposalStatus.Expired,
      );

      const common = {
        contractId,
        dao: contract.contractId,
      };

      yield [
        {
          ...common,
          metric: DaoStatsMetric.CouncilSize,
          value: councilSize,
        },
        {
          ...common,
          metric: DaoStatsMetric.MembersCount,
          value: members.length,
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
          value: proposalsPayouts.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsCouncilMemberCount,
          value: proposalsCouncilMembers.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsPolicyChangeCount,
          value: proposalsPolicyChanges.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsInProgressCount,
          value: proposalsInProgress.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsApprovedCount,
          value: proposalsApproved.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsRejectedCount,
          value: proposalsRejected.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsExpiredCount,
          value: proposalsExpired.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsBountyCount,
          value: proposalsBounties.length,
        },
        {
          ...common,
          metric: DaoStatsMetric.ProposalsMemberCount,
          value: proposalsMembers.length,
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
    }

    this.logger.log('Finished aggregating Astro metrics.');
  }
}
