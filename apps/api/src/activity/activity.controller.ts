import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { ActivityTotalResponse } from './dto/activity-total.dto';
import { ActivityService } from './activity.service';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiResponse({
    status: 200,
    type: ActivityTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/')
  async total(
    @Param() context: ContractContext,
  ): Promise<ActivityTotalResponse> {
    return this.activityService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/history')
  async totalHistory(
    @Param() context: ContractContext,
    @Query() metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.activityService.totalsHistory(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/leaderboard')
  async usersLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.activityService.leaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: ActivityTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao')
  async daoTotal(
    @Param() context: DaoContractContext,
  ): Promise<ActivityTotalResponse> {
    return this.activityService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao/history')
  async daosTotalHistory(
    @Param() context: DaoContractContext,
    @Query() metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.activityService.totalsHistory(context, metricQuery);
  }
}
