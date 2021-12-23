import moment from 'moment';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DaoStatsHistoryService,
  DaoStatsHistoryHistoryResponse,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TransactionType,
  MetricType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GovernanceTotalResponse } from './dto/governance-total.dto';
import { ProposalsTypesLeaderboardResponse } from './dto/proposals-types-leaderboard-response.dto';
import { ProposalsTypesHistoryResponse } from './dto/proposals-types-history-response.dto';
import { VoteRateLeaderboardResponse } from './dto/vote-rate-leaderboard-response.dto';
import { getGrowth, getRate, patchMetricDays } from '../utils';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(): Promise<GovernanceTotalResponse> {
    const dayAgo = moment().subtract(1, 'days');

    const [
      proposalsCount,
      dayAgoProposalsCount,
      proposalsApprovedCount,
      dayAgoProposalsApprovedCount,
      proposalsPayoutCount,
      proposalsBountyCount,
      proposalsMemberCount,
    ] = await Promise.all([
      this.daoStatsService.getValue({
        metric: DaoStatsMetric.ProposalsCount,
      }),
      this.daoStatsHistoryService.getValue({
        metric: DaoStatsMetric.ProposalsCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getValue({
        metric: DaoStatsMetric.ProposalsApprovedCount,
      }),
      this.daoStatsHistoryService.getValue({
        metric: DaoStatsMetric.ProposalsApprovedCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getValue({
        metric: DaoStatsMetric.ProposalsPayoutCount,
      }),
      this.daoStatsService.getValue({
        metric: DaoStatsMetric.ProposalsBountyCount,
      }),
      this.daoStatsService.getValue({
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
        count: getRate(proposalsApprovedCount, proposalsCount),
        growth: getGrowth(
          proposalsApprovedCount / proposalsCount,
          dayAgoProposalsApprovedCount / dayAgoProposalsCount,
        ),
      },
    };
  }

  async proposals(metricQuery: MetricQuery): Promise<MetricResponse> {
    const [proposalCountHistory, metrics] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsCount,
      }),
      this.transactionService.getTotalCountDaily(TransactionType.AddProposal, {
        to: metricQuery.to,
      }),
    ]);

    return {
      metrics: patchMetricDays(
        metricQuery,
        metrics.map(({ day, count }) => ({
          timestamp: moment(day).valueOf(),
          count:
            proposalCountHistory.find(({ date }) =>
              moment(date).isSame(moment(day), 'day'),
            )?.value || count,
        })),
        MetricType.Total,
      ),
    };
  }

  async proposalsLeaderboard(): Promise<LeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const dayAgo = moment().subtract(1, 'days');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      metric: DaoStatsMetric.ProposalsCount,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            dao,
            metric: DaoStatsMetric.ProposalsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            dao,
            metric: DaoStatsMetric.ProposalsCount,
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
    metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    const { from, to } = metricQuery;

    const [totals, payouts, bounties, members] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsPayoutCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsBountyCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsMemberCount,
        from,
        to,
      }),
    ]);

    const toResponse = (data: DaoStatsHistoryHistoryResponse[]) =>
      data.map((row) => ({
        timestamp: row.date.valueOf(),
        count: row.value,
      }));

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
        financial: toResponse(payouts),
        bounties: toResponse(bounties),
        members: toResponse(members),
      },
    };
  }

  async proposalsTypesLeaderboard(): Promise<ProposalsTypesLeaderboardResponse> {
    const daos = await this.daoStatsService.getLeaderboard({
      metric: DaoStatsMetric.ProposalsCount,
    });

    const leaderboard = await Promise.all(
      daos.map(async ({ dao, value }) => {
        const [payouts, bounties, members] = await Promise.all([
          this.daoStatsService.getValue({
            dao,
            metric: DaoStatsMetric.ProposalsPayoutCount,
          }),
          this.daoStatsService.getValue({
            dao,
            metric: DaoStatsMetric.ProposalsBountyCount,
          }),
          this.daoStatsService.getValue({
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

  async voteRate(metricQuery?: MetricQuery): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    const [totalHistory, approvedHistory] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        metric: DaoStatsMetric.ProposalsApprovedCount,
        from,
        to,
      }),
    ]);

    return {
      metrics: patchMetricDays(
        metricQuery,
        totalHistory.map((row) => {
          const approved = approvedHistory.find(
            ({ date }) => date.valueOf() === row.date.valueOf(),
          );
          return {
            timestamp: row.date.valueOf(),
            count: getRate(approved?.value || 0, row.value),
          };
        }),
        MetricType.Total,
      ),
    };
  }

  async voteRateLeaderboard(): Promise<VoteRateLeaderboardResponse> {
    const dayAgo = moment().subtract(1, 'days');
    const weekAgo = moment().subtract(7, 'days');

    const [totalLeaderboard, approvedLeaderboard] = await Promise.all([
      this.daoStatsService.getLeaderboard({
        metric: DaoStatsMetric.ProposalsCount,
        limit: 0,
      }),
      this.daoStatsService.getLeaderboard({
        metric: DaoStatsMetric.ProposalsApprovedCount,
        limit: 0,
      }),
    ]);

    const leaderboard = totalLeaderboard.map(({ dao, value }) => {
      const approved = approvedLeaderboard.find((row) => dao === row.dao);
      return {
        dao,
        total: value,
        approved: approved?.value || 0,
        rate: getRate(approved?.value || 0, value),
      };
    });

    leaderboard.sort((a, b) => b.rate - a.rate);
    leaderboard.splice(10);

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, total, approved, rate }) => {
        const [dayAgoTotal, dayAgoApproved, totalHistory, approvedHistory] =
          await Promise.all([
            this.daoStatsHistoryService.getValue({
              dao,
              metric: DaoStatsMetric.ProposalsCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getValue({
              dao,
              metric: DaoStatsMetric.ProposalsApprovedCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              dao,
              metric: DaoStatsMetric.ProposalsCount,
              from: weekAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              dao,
              metric: DaoStatsMetric.ProposalsApprovedCount,
              from: weekAgo.valueOf(),
            }),
          ]);

        const dayAgoRate = getRate(dayAgoApproved, dayAgoTotal);

        return {
          dao,
          proposals: {
            count: total,
            growth: getGrowth(total, dayAgoTotal),
          },
          approvedProposals: {
            count: approved,
            growth: getGrowth(approved, dayAgoApproved),
          },
          voteRate: {
            count: rate,
            growth: getGrowth(rate, dayAgoRate),
          },
          overview: totalHistory.map(({ date, value }) => {
            const approved = approvedHistory.find(
              (row) => date.valueOf() === row.date.valueOf(),
            );
            return {
              timestamp: date.valueOf(),
              count: getRate(approved?.value || 0, value),
            };
          }),
        };
      }),
    );

    return { metrics };
  }
}
