import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Contract,
  ContractContext,
  DaoContractContext,
  DaoStatsMetric,
  DaoStatsService,
  DaoStatsHistoryService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TransactionType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { ActivityTotalResponse } from './dto/activity-total.dto';
import { getGrowth } from '../utils';
import { ProposalsTypes } from './dto/proposals-types.dto';
import { ProposalsTypesLeaderboardResponse } from './dto/proposals-types-leaderboard-response.dto';
import { ProposalsTypesHistoryResponse } from './dto/proposals-types-history-response.dto';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<ActivityTotalResponse> {
    const { contract, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [proposalsCount, dayAgoProposalsCount, ...proposalsByType] =
      await Promise.all([
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
        ...Object.entries(this.PROPOSALS_TYPES).map(async ([key, metric]) => {
          const value = await this.daoStatsService.getValue({
            contract,
            dao,
            metric,
          });
          return [key, value];
        }),
      ]);

    return {
      proposals: {
        count: proposalsCount,
        growth: getGrowth(proposalsCount, dayAgoProposalsCount),
      },
      proposalsByType: Object.fromEntries(proposalsByType),
      voteRate: {
        count: 0,
        growth: 0,
      },
    };
  }

  async proposalsHistory(
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

  async proposalsTypesHistory(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const metrics = await Promise.all(
      Object.entries(this.PROPOSALS_TYPES).map(async ([key, metric]) => {
        const history = await this.daoStatsHistoryService.getHistory({
          contract,
          dao,
          metric,
          from,
          to,
        });
        return [
          key,
          history.map((row) => ({
            timestamp: row.date.valueOf(),
            value: row.value,
          })),
        ];
      }),
    );

    return { metrics: Object.fromEntries(metrics) };
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
      daos.map(async ({ dao }) => {
        const proposalsByType = await Promise.all(
          Object.entries(this.PROPOSALS_TYPES).map(async ([key, metric]) => {
            const value = await this.daoStatsService.getValue({
              contract,
              dao,
              metric,
            });
            return [key, value];
          }),
        );

        return {
          dao,
          proposalsByType: Object.fromEntries(proposalsByType),
        };
      }),
    );

    return { leaderboard };
  }

  get PROPOSALS_TYPES(): Record<keyof ProposalsTypes, DaoStatsMetric> {
    return {
      payout: DaoStatsMetric.ProposalsPayoutCount,
      councilMember: DaoStatsMetric.ProposalsCouncilMemberCount,
      policyChange: DaoStatsMetric.ProposalsPolicyChangeCount,
      expired: DaoStatsMetric.ProposalsExpiredCount,
    };
  }
}
