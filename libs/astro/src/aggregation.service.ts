import moment from 'moment';
import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import {
  Aggregator,
  DaoStatsDto,
  DaoStatsMetric,
  findAllByKey,
  millisToNanos,
  nanosToMillis,
  TransactionDto,
  TransactionType,
  VoteType,
} from '@dao-stats/common';
import { NearIndexerService, Transaction } from '@dao-stats/near-indexer';
import { NearHelperService } from '@dao-stats/near-helper';
import { AstroService } from './astro.service';
import { isRoleGroup, isRoleGroupCouncil, yoctoToNear } from './utils';
import {
  BountiesResponse,
  Policy,
  ProposalKind,
  ProposalsResponse,
  ProposalStatus,
  Role,
  RoleKindGroup,
} from './types';

const FIRST_BLOCK_TIMESTAMP = BigInt('1622560541482025354'); // first astro TX

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly nearIndexerService: NearIndexerService,
    private readonly nearHelperService: NearHelperService,
    private readonly astroService: AstroService,
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

    const contracts = await this.astroService.getDaoContracts();

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

      let policy: Policy,
        proposals: ProposalsResponse,
        bounties: BountiesResponse,
        fts: string[],
        nfts: string[];

      try {
        [policy, proposals, bounties, fts, nfts] = await Promise.all([
          contract.get_policy(),
          contract.getProposalsChunked(),
          contract.getBountiesChunked(),
          this.nearHelperService.getLikelyTokens(contract.contractId),
          this.nearHelperService.getLikelyNFTs(contract.contractId),
        ]);
      } catch (err) {
        this.logger.error(err);
      }

      const common = {
        contractId,
        dao: contract.contractId,
      };

      if (policy) {
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
        ];
      }

      if (proposals) {
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

        yield [
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
        ];
      }

      if (bounties) {
        yield [
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
                acc + yoctoToNear(bounty.amount) * bounty.times,
              0,
            ),
          },
        ];
      }

      if (fts) {
        yield [
          {
            ...common,
            metric: DaoStatsMetric.FtsCount,
            value: fts.length,
          },
        ];
      }

      if (nfts) {
        yield [
          {
            ...common,
            metric: DaoStatsMetric.NftsCount,
            value: nfts.length,
          },
        ];
      }
    }

    this.logger.log('Finished aggregating Astro metrics.');
  }
}
