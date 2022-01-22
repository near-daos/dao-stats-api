import moment from 'moment';
import { Injectable } from '@nestjs/common';
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
  MetricType,
} from '@dao-stats/common';
import {
  GovernanceTotalResponse,
  ProposalsTypesHistoryResponse,
  ProposalsTypesLeaderboardResponse,
  VoteRateLeaderboardResponse,
} from './dto';
import { MetricService } from '../common/metric.service';
import { getGrowth, getRate, patchMetricDays } from '../utils';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly configService: ConfigService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
    private readonly metricService: MetricService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GovernanceTotalResponse> {
    const { contractId, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [
      proposalsCount,
      dayAgoProposalsCount,
      proposalsApprovedCount,
      dayAgoProposalsApprovedCount,
      proposalsTransferCount,
      proposalsBountyCount,
      proposalsMemberCount,
    ] = await Promise.all([
      this.daoStatsService.getTotal({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
      }),
      this.daoStatsHistoryService.getLastValue({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getTotal({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsApprovedCount,
      }),
      this.daoStatsHistoryService.getLastValue({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsApprovedCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getTotal({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsTransferCount,
      }),
      this.daoStatsService.getTotal({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsBountyCount,
      }),
      this.daoStatsService.getTotal({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsMemberCount,
      }),
    ]);

    const voteRate = getRate(proposalsApprovedCount, proposalsCount);

    return {
      proposals: {
        count: proposalsCount,
        growth: getGrowth(proposalsCount, dayAgoProposalsCount),
      },
      proposalsByType: {
        governance:
          proposalsCount -
          (proposalsTransferCount +
            proposalsBountyCount +
            proposalsMemberCount),
        financial: proposalsTransferCount,
        bounties: proposalsBountyCount,
        members: proposalsMemberCount,
      },
      voteRate: {
        count: voteRate,
        growth: getGrowth(
          voteRate,
          getRate(dayAgoProposalsApprovedCount, dayAgoProposalsCount),
        ),
      },
    };
  }

  async proposals(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.ProposalsCount,
    );
  }

  async proposalsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(
      context,
      DaoStatsMetric.ProposalsCount,
    );
  }

  async proposalsTypes(
    context: DaoContractContext | ContractContext,

    metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    const { contractId, dao } = context as DaoContractContext;

    const { from, to } = metricQuery;

    const [totals, payouts, bounties, members] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsTransferCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsBountyCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsMemberCount,
        from,
        to,
      }),
    ]);

    const revPayouts = payouts.splice(0).reverse();
    const revBounties = bounties.splice(0).reverse();
    const revMembers = members.splice(0).reverse();

    const overall = totals.map((row) => {
      const timestamp = row.date.valueOf();
      const payout =
        revPayouts.find(({ date }) => date.valueOf() <= timestamp)?.value || 0;
      const bounty =
        revBounties.find(({ date }) => date.valueOf() <= timestamp)?.value || 0;
      const member =
        revMembers.find(({ date }) => date.valueOf() <= timestamp)?.value || 0;

      return {
        timestamp,
        governance: row.value - (payout + bounty + member),
        financial: payout,
        bounties: bounty,
        members: member,
      };
    });

    return {
      metrics: {
        governance: overall.map(({ timestamp, governance: count }) => ({
          timestamp,
          count,
        })),
        financial: overall.map(({ timestamp, financial: count }) => ({
          timestamp,
          count,
        })),
        bounties: overall.map(({ timestamp, bounties: count }) => ({
          timestamp,
          count,
        })),
        members: overall.map(({ timestamp, members: count }) => ({
          timestamp,
          count,
        })),
      },
    };
  }

  async proposalsTypesLeaderboard(
    context: ContractContext,
  ): Promise<ProposalsTypesLeaderboardResponse> {
    const { contractId } = context;

    const daos = await this.daoStatsService.getLeaderboard({
      contractId,
      metric: DaoStatsMetric.ProposalsCount,
    });

    const leaderboard = await Promise.all(
      daos.map(async ({ dao, total }) => {
        const [payouts, bounties, members] = await Promise.all([
          this.daoStatsService.getTotal({
            contractId,
            dao,
            metric: DaoStatsMetric.ProposalsTransferCount,
          }),
          this.daoStatsService.getTotal({
            contractId,
            dao,
            metric: DaoStatsMetric.ProposalsBountyCount,
          }),
          this.daoStatsService.getTotal({
            contractId,
            dao,
            metric: DaoStatsMetric.ProposalsMemberCount,
          }),
        ]);

        return {
          dao,
          proposalsByType: {
            governance: total - (payouts + bounties + members),
            financial: payouts,
            bounties,
            members,
          },
        };
      }),
    );

    return { leaderboard };
  }

  async voteRate(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<MetricResponse> {
    const { contractId, dao } = context as DaoContractContext;

    const { from, to } = metricQuery;

    const [totalHistory, approvedHistory] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
        from,
        to,
      }),
      this.daoStatsHistoryService.getHistory({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsApprovedCount,
        from,
        to,
      }),
    ]);

    const revApprovedHistory = approvedHistory.splice(0).reverse();

    return {
      metrics: patchMetricDays(
        metricQuery,
        totalHistory.map((row) => {
          const timestamp = row.date.valueOf();
          const approved =
            revApprovedHistory.find(({ date }) => date.valueOf() <= timestamp)
              ?.value || 0;
          return {
            timestamp,
            count: getRate(approved, row.value),
          };
        }),
        MetricType.Total,
      ),
    };
  }

  async voteRateLeaderboard(
    context: DaoContractContext | ContractContext,
  ): Promise<VoteRateLeaderboardResponse> {
    const { contractId, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');
    const monthAgo = moment().subtract(30, 'month');

    const [totalLeaderboard, approvedLeaderboard] = await Promise.all([
      this.daoStatsService.getLeaderboard({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsCount,
        limit: 0,
      }),
      this.daoStatsService.getLeaderboard({
        contractId,
        dao,
        metric: DaoStatsMetric.ProposalsApprovedCount,
        limit: 0,
      }),
    ]);

    const leaderboard = totalLeaderboard.map(({ dao, total }) => {
      const approved = approvedLeaderboard.find((row) => dao === row.dao);
      return {
        dao,
        total,
        approved: approved?.total || 0,
        rate: getRate(approved?.total || 0, total),
      };
    });

    leaderboard.sort((a, b) => b.rate - a.rate);
    leaderboard.splice(10);

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, total, approved, rate }) => {
        const [dayAgoTotal, dayAgoApproved, totalHistory, approvedHistory] =
          await Promise.all([
            this.daoStatsHistoryService.getLastValue({
              contractId,
              dao,
              metric: DaoStatsMetric.ProposalsCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getLastValue({
              contractId,
              dao,
              metric: DaoStatsMetric.ProposalsApprovedCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contractId,
              dao,
              metric: DaoStatsMetric.ProposalsCount,
              from: monthAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contractId,
              dao,
              metric: DaoStatsMetric.ProposalsApprovedCount,
              from: monthAgo.valueOf(),
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
