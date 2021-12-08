import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricQueryPipe,
  MetricResponse,
  LeaderboardMetricResponse,
} from '@dao-stats/common';

import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { ActivityTotalResponse } from './dto/activity-total.dto';
import { ProposalsTypesLeaderboardResponse } from './dto/proposals-types-leaderboard-response.dto';
import { ProposalsTypesHistoryResponse } from './dto/proposals-types-history-response.dto';
import { ActivityService } from './activity.service';

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
  @Get('/proposals/history')
  async totalHistory(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.activityService.proposalsHistory(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/proposals/leaderboard')
  async proposalsTypes(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.activityService.proposalsLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: ProposalsTypesHistoryResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/proposals-types/history')
  async proposalsTypesHistory(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    return this.activityService.proposalsTypesHistory(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: ProposalsTypesLeaderboardResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/proposals-types/leaderboard')
  async proposalsTypesLeaderboard(
    @Param() context: ContractContext,
  ): Promise<ProposalsTypesLeaderboardResponse> {
    return this.activityService.proposalsTypesLeaderboard(context);
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
  @Get('/:dao/proposals')
  async daosTotalHistory(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.activityService.proposalsHistory(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: ProposalsTypesHistoryResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao/proposals-types')
  async daoProposalsTypes(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    return this.activityService.proposalsTypesHistory(context, metricQuery);
  }
}
