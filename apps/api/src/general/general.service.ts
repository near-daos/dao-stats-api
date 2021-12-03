import { millisToNanos } from '@dao-stats/astro/utils';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { GeneralTotalResponse } from './dto/general-total.dto';
import moment from 'moment';

@Injectable()
export class GeneralService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GeneralTotalResponse> {
    const daoCount = await this.transactionService.getContractTotalCount(
      context,
    );

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoDaoCount = await this.transactionService.getContractTotalCount(
      context,
      null,
      millisToNanos(dayAgo.valueOf()),
    );

    const activity =
      await this.transactionService.getContractActivityTotalCount(context);
    const dayAgoActivity =
      await this.transactionService.getContractActivityTotalCount(
        context,
        null,
        millisToNanos(dayAgo.valueOf()),
      );

    return {
      dao: {
        count: daoCount,
        growth: Math.floor(
          ((daoCount - dayAgoDaoCount) / dayAgoDaoCount) * 100,
        ),
      },
      activity: {
        count: activity,
        growth: Math.floor(
          ((activity - dayAgoActivity) / dayAgoActivity) * 100,
        ),
      },
    };
  }

  async daos(
    contractContext: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract } = contractContext;
    const { from, to } = metricQuery;

    return this.transactionService.getDaoCountHistory(contract, from, to);
  }

  async activity(
    contractContext: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract } = contractContext;
    const { from, to } = metricQuery;

    return this.transactionService.getDaoActivityHistory(contract, from, to);
  }

  async activityLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    return this.transactionService.getDaoActivityLeaderboard(contract);
  }
}
