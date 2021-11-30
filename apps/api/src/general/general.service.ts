import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { TenantContext } from '@dao-stats/common/dto/tenant-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { GeneralDaoResponse } from './dto/general-dao.dto';
import { GeneralLeaderboardResponse } from './dto/general-leaderboard.dto';
import { GeneralTotalResponse } from './dto/general-total.dto';

@Injectable()
export class GeneralService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(tenantContext: TenantContext): Promise<GeneralTotalResponse> {
    const { contract } = tenantContext;

    const daoCount = await this.transactionService.getContractTotalCount(
      contract,
    );

    const today = new Date();
    const weekAgo = daysFromDate(today, -7);
    const weekAgoDaoCount = await this.transactionService.getContractTotalCount(
      contract,
      millisToNanos(weekAgo.getTime()),
    );

    const activity =
      await this.transactionService.getContractActivityTotalCount(contract);
    const weekAgoActivity =
      await this.transactionService.getContractActivityTotalCount(
        contract,
        millisToNanos(weekAgo.getTime()),
      );

    const twoWeeksAgo = daysFromDate(weekAgo, -7);
    const twoWeeksAgoActivity =
      await this.transactionService.getContractActivityTotalCount(
        contract,
        millisToNanos(twoWeeksAgo.getTime()),
        millisToNanos(weekAgo.getTime()),
      );

    return {
      dao: {
        count: daoCount,
        growth: Math.ceil(
          (weekAgoDaoCount / (daoCount - weekAgoDaoCount)) * 100,
        ),
      },
      activity: {
        count: activity,
        growth: Math.ceil(
          ((weekAgoActivity - twoWeeksAgoActivity) / twoWeeksAgoActivity) * 100,
        ),
      },
    };
  }

  async daos(
    tenantContext: TenantContext,
    metricQuery: MetricQuery,
  ): Promise<GeneralDaoResponse> {
    const { contract } = tenantContext;
    const { from, to } = metricQuery;

    return this.transactionService.getDaoCountHistory(contract, from, to);
  }

  async activity(
    tenantContext: TenantContext,
    metricQuery: MetricQuery,
  ): Promise<GeneralDaoResponse> {
    const { contract } = tenantContext;
    const { from, to } = metricQuery;

    return this.transactionService.getDaoActivityHistory(contract, from, to);
  }

  async activityLeaderboard(
    tenantContext: TenantContext,
  ): Promise<GeneralLeaderboardResponse> {
    const { contract } = tenantContext;

    return this.transactionService.getDaoActivityLeaderboard(contract);
  }
}
