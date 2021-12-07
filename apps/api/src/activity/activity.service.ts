import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import PromisePool from '@supercharge/promise-pool';

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
import { getDailyIntervals, getGrowth } from '../utils';
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

    const [proposalsCount, dayAgoProposalsCount, ...proposalsByType] =
      await Promise.all([
        this.transactionService.getTotalCount(
          context,
          TransactionType.AddProposal,
        ),
        this.transactionService.getTotalCount(
          context,
          TransactionType.AddProposal,
          {
            from: null,
            to: moment().subtract(1, 'days').valueOf(),
          },
        ),
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
    const { from, to } = metricQuery;
    const days = getDailyIntervals(from, to || moment().valueOf());

    const metrics = await this.transactionService.getTotalCountDaily(
      context,
      TransactionType.AddProposal,
      {
        from: null,
        to: metricQuery.to,
      },
    );

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async proposalsLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    const today = moment();
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), today.valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getProposalsLeaderboard(
          contract,
          null,
          end,
        );

        return { proposalsCount: [...qr], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoProposalsCount =
      await this.transactionService.getProposalsLeaderboard(
        contract,
        null,
        dayAgo.valueOf(),
      );

    const totalProposalsCount =
      await this.transactionService.getProposalsLeaderboard(
        contract,
        null,
        today.valueOf(),
      );

    const metrics = totalProposalsCount.map(
      ({ receiver_account_id: dao, count }) => {
        const dayAgoCount =
          dayAgoProposalsCount.find(
            ({ receiver_account_id }) => receiver_account_id === dao,
          )?.count || 0;

        return {
          dao,
          activity: {
            count,
            growth: Math.floor(
              ((count - dayAgoCount) / (dayAgoCount || 1)) * 100,
            ),
          },
          overview: days.map(({ end: timestamp }) => ({
            timestamp,
            count:
              byDays
                .find(({ end }) => end === timestamp)
                ?.proposalsCount?.find(
                  ({ receiver_account_id }) => receiver_account_id === dao,
                )?.count || 0,
          })),
        };
      },
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
