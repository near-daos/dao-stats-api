import moment from 'moment';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TransactionType,
  VoteType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GovernanceTotalResponse } from './dto/governance-total.dto';
import { ProposalsTypesLeaderboardResponse } from './dto/proposals-types-leaderboard-response.dto';
import { ProposalsTypesHistoryResponse } from './dto/proposals-types-history-response.dto';
import { getDailyIntervals, getGrowth } from '../utils';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GovernanceTotalResponse> {
    const { contract, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [
      proposalsCount,
      dayAgoProposalsCount,
      voteRate,
      dayAgoVoteRate,
      proposalsPayoutCount,
      proposalsBountyCount,
      proposalsMemberCount,
    ] = await Promise.all([
      this.daoStatsService.getValue({
        contract,
        dao: null,
        metric: DaoStatsMetric.ProposalsCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao: null,
        metric: DaoStatsMetric.ProposalsCount,
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getVoteTotalCount(
        context,
        null,
        VoteType.VoteApprove,
      ),
      this.transactionService.getVoteTotalCount(
        context,
        {
          to: dayAgo.valueOf(),
        },
        VoteType.VoteApprove,
      ),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsPayoutCount,
      }),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsBountyCount,
      }),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsMemberCount,
      }),
    ]);

    return {
      proposals: {
        count: proposalsCount,
        growth: getGrowth(proposalsCount, dayAgoProposalsCount),
      },
      proposalsByType: {
        governance:
          proposalsCount -
          (proposalsPayoutCount + proposalsBountyCount + proposalsMemberCount),
        financial: proposalsPayoutCount,
        bounties: proposalsBountyCount,
        members: proposalsMemberCount,
      },
      voteRate: {
        count: voteRate,
        growth: getGrowth(voteRate, dayAgoVoteRate),
      },
    };
  }

  async proposals(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract, dao } = context as DaoContractContext;

    const [proposalCountHistory, metrics] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
      }),
      this.transactionService.getTotalCountDaily(
        context,
        TransactionType.AddProposal,
        {
          to: metricQuery.to,
        },
      ),
    ]);

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count:
          proposalCountHistory.find(({ date }) =>
            moment(date).isSame(moment(day), 'day'),
          )?.value || count,
      })),
    };
  }

  async proposalsLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    const weekAgo = moment().subtract(7, 'days');
    const dayAgo = moment().subtract(1, 'days');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.ProposalsCount,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.GroupsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contract,
            dao,
            metric: DaoStatsMetric.GroupsCount,
            from: weekAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: value,
            growth: getGrowth(value, prevValue),
          },
          overview: history.map((row) => ({
            timestamp: row.date.valueOf(),
            count: row.value,
          })),
        };
      }),
    );

    return { metrics };
  }

  async proposalsTypes(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const [totals, payouts, bounties, members] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsPayoutCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsBountyCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contract,
        dao,
        metric: DaoStatsMetric.ProposalsMemberCount,
        from,
        to,
      }),
    ]);

    return {
      metrics: {
        governance: totals.map((row) => {
          const payout = payouts.find(
            ({ date }) => date.valueOf() === row.date.valueOf(),
          );
          const bounty = bounties.find(
            ({ date }) => date.valueOf() === row.date.valueOf(),
          );
          const member = members.find(
            ({ date }) => date.valueOf() === row.date.valueOf(),
          );

          return {
            timestamp: row.date.valueOf(),
            count:
              row.value -
              (payout?.value || 0 + bounty?.value || 0 + member?.value || 0),
          };
        }),
        financial: payouts.map((row) => ({
          timestamp: row.date.valueOf(),
          count: row.value,
        })),
        bounties: bounties.map((row) => ({
          timestamp: row.date.valueOf(),
          count: row.value,
        })),
        members: members.map((row) => ({
          timestamp: row.date.valueOf(),
          count: row.value,
        })),
      },
    };
  }

  async proposalsTypesLeaderboard(
    contractContext: ContractContext,
  ): Promise<ProposalsTypesLeaderboardResponse> {
    const { contract } = contractContext;

    const daos = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.ProposalsCount,
    });

    const leaderboard = await Promise.all(
      daos.map(async ({ dao, value }) => {
        const [payouts, bounties, members] = await Promise.all([
          this.daoStatsService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.ProposalsPayoutCount,
          }),
          this.daoStatsService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.ProposalsBountyCount,
          }),
          this.daoStatsService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.ProposalsMemberCount,
          }),
        ]);

        return {
          dao,
          proposalsByType: {
            governance: value - (payouts + bounties + members),
            financial: payouts,
            bounties,
            members,
          },
        };
      }),
    );

    return { leaderboard };
  }

  async rate(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getVoteTotalCountDaily(
      context,
      metricQuery,
      VoteType.VoteApprove,
    );

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async rateLeaderboard(
    context: DaoContractContext | ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());
    const dayAgo = moment().subtract(1, 'days');

    const [byDays, dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getVoteTotalCountLeaderboard(
        context,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        VoteType.VoteApprove,
        true,
      ),
      this.transactionService.getVoteTotalCountLeaderboard(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getVoteTotalCountLeaderboard(context, {
        to: moment().valueOf(),
      }),
    ]);

    const metrics = totalActivity.map(({ receiver_account_id: dao, count }) => {
      const dayAgoCount =
        dayAgoActivity.find(
          ({ receiver_account_id }) => receiver_account_id === dao,
        )?.count || 0;

      return {
        dao,
        activity: {
          count,
          growth: getGrowth(count, dayAgoCount),
        },
        overview: days.map(({ end: timestamp }) => ({
          timestamp,
          count:
            byDays.find(
              ({ receiver_account_id, day }) =>
                receiver_account_id === dao &&
                moment(day).isSame(moment(timestamp), 'day'),
            )?.count || 0,
        })),
      };
    });

    return { metrics };
  }
}
