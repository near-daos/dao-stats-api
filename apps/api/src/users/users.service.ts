import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import { DaoTenantContext } from '@dao-stats/common/dto/dao-tenant-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { TenantContext } from '@dao-stats/common/dto/tenant-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { UsersTotalResponse } from './dto/users-total.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(context: DaoTenantContext): Promise<UsersTotalResponse> {
    const usersCount = await this.transactionService.getUsersTotalCount(
      context,
    );

    const today = new Date();
    const weekAgo = daysFromDate(today, -7);
    const weekAgoUsersCount = await this.transactionService.getUsersTotalCount(
      context,
      millisToNanos(weekAgo.getTime()),
    );

    return {
      users: {
        count: usersCount,
        growth: Math.ceil(
          (weekAgoUsersCount / (usersCount - weekAgoUsersCount)) * 100,
        ),
      },
    };
  }

  async totalsHistory(
    context: DaoTenantContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    return this.transactionService.getUsersCountHistory(context, from, to);
  }

  async leaderboard(
    tenantContext: TenantContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = tenantContext;

    return this.transactionService.getUsersLeaderboard(contract);
  }
}
