import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryHistoryResponse,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  MetricType,
  TransactionType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GovernanceTotalResponse } from './dto/governance-total.dto';
import { ProposalsTypesLeaderboardResponse } from './dto/proposals-types-leaderboard-response.dto';
import { ProposalsTypesHistoryResponse } from './dto/proposals-types-history-response.dto';
import { VoteRateLeaderboardResponse } from './dto/vote-rate-leaderboard-response.dto';
import { MetricService } from '../common/metric.service';
import { getGrowth, getRate, patchMetricDays } from '../utils';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
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
      this.daoStatsHistoryService.getLastTotal({
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
      this.daoStatsHistoryService.getLastTotal({
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
    const { contractId, dao } = context as DaoContractContext;

    const [proposalCountHistory, metrics] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        contractId,
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
      metrics: patchMetricDays(
        metricQuery,
        metrics.map(({ day, count }) => ({
          timestamp: moment(day).valueOf(),
          count:
            proposalCountHistory.find(({ date }) =>
              moment(date).isSame(moment(day), 'day'),
            )?.total || count,
        })),
        MetricType.Total,
      ),
    };
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

    const toResponse = (data: DaoStatsHistoryHistoryResponse) =>
      data.map(({ date, total }) => ({
        timestamp: date.valueOf(),
        count: total,
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
              row.total -
              (payout?.total || 0 + bounty?.total || 0 + member?.total || 0),
          };
        }),
        financial: toResponse(payouts),
        bounties: toResponse(bounties),
        members: toResponse(members),
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

    return {
      metrics: patchMetricDays(
        metricQuery,
        totalHistory.map((row) => {
          const approved = approvedHistory.find(
            ({ date }) => date.valueOf() === row.date.valueOf(),
          );
          return {
            timestamp: row.date.valueOf(),
            count: getRate(approved?.total || 0, row.total),
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
            this.daoStatsHistoryService.getLastTotal({
              contractId,
              dao,
              metric: DaoStatsMetric.ProposalsCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getLastTotal({
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
          overview: totalHistory.map(({ date, total }) => {
            const approved = approvedHistory.find(
              (row) => date.valueOf() === row.date.valueOf(),
            );
            return {
              timestamp: date.valueOf(),
              count: getRate(approved?.total || 0, total),
            };
          }),
        };
      }),
    );

    return { metrics };
  }
}
