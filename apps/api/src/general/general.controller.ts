import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricResponse,
  LeaderboardMetricResponse,
} from '@dao-stats/common';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { GeneralService } from './general.service';
import { MetricQueryPipe } from '@dao-stats/common/pipes/metric-query.pipe';

@ApiTags('General')
@Controller('general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @ApiResponse({
    status: 200,
    type: GeneralTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/')
  async total(
    @Param() context: ContractContext,
  ): Promise<GeneralTotalResponse> {
    return this.generalService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/daos')
  async daos(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.generalService.daos(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/activity')
  async activity(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.generalService.activity(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/groups')
  async groups(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.generalService.groups(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/activity/leaderboard')
  async activityLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.generalService.activityLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: GeneralTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao')
  async daoTotal(
    @Param() context: DaoContractContext,
  ): Promise<GeneralTotalResponse> {
    return this.generalService.totals(context);
  }
}
