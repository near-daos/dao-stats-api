import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Contract,
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  picoToNear,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { TvlTotalResponse } from './dto/tvl-total.dto';
import { getGrowth } from '../utils';
import { TvlBountiesLeaderboardResponse } from './dto/tvl-bounties-leaderboard-response.dto';

@Injectable()
export class TvlService {
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
  ): Promise<TvlTotalResponse> {
    const { contract, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'day');

    const [
      bountiesCount,
      bountiesCountPrev,
      bountiesValueLocked,
      bountiesValueLockedPrev,
    ] = await Promise.all([
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesValueLocked,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesValueLocked,
        to: dayAgo.valueOf(),
      }),
    ]);

    return {
      // TODO
      grants: {
        number: {
          count: 0,
          growth: 0,
        },
        vl: {
          count: 0,
          growth: 0,
        },
      },
      // TODO
      bounties: {
        number: {
          count: bountiesCount,
          growth: getGrowth(bountiesCount, bountiesCountPrev),
        },
        vl: {
          count: picoToNear(bountiesValueLocked),
          growth: getGrowth(bountiesValueLocked, bountiesValueLockedPrev),
        },
      },
      // TODO
      tvl: {
        count: 0,
        growth: 0,
      },
    };
  }

  async bountiesLeaderboard(
    context: ContractContext,
  ): Promise<TvlBountiesLeaderboardResponse> {
    const { contract } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.BountiesCount, // TODO confirm
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory, vl, vlPrev, vlHistory] =
          await Promise.all([
            this.daoStatsHistoryService.getValue({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesCount,
              from: weekAgo.valueOf(),
            }),
            this.daoStatsService.getValue({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
            }),
            this.daoStatsHistoryService.getValue({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
              from: weekAgo.valueOf(),
            }),
          ]);

        return {
          dao,
          number: {
            count: value,
            growth: getGrowth(value, countPrev),
            overview: countHistory.map((row) => ({
              timestamp: row.date.valueOf(),
              count: row.value,
            })),
          },
          vl: {
            count: picoToNear(vl),
            growth: getGrowth(vl, vlPrev),
            overview: vlHistory.map((row) => ({
              timestamp: row.date.valueOf(),
              count: row.value,
            })),
          },
        };
      }),
    );

    return { metrics };
  }
}
