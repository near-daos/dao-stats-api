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
        from: dayAgo.valueOf(),
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
        from: dayAgo.valueOf(),
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
}
