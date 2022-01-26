import {
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';

import {
  ContractContext,
  MetricResponse,
  MetricQuery,
  LeaderboardMetricResponse,
  TotalMetric,
  DaoStatsMetric,
  DaoContractContext,
} from '@dao-stats/common';
import { ActivityInterval } from '@dao-stats/common/types/activity-interval';

import { ContractContextPipe, MetricQueryPipe } from '../pipes';
import { ActivityApiMetricService } from './interfaces/activity-api-metric.interface';
import { ActivityApiMetricPipe } from './pipes/activity-api-metric.pipe';
import { ActivityApiMetric } from './types/activity-api-metric';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  @ApiResponse({
    status: 200,
    type: TotalMetric,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'metric',
    description: `Activity Metric: e.g ${ActivityApiMetric.DaoActivity}`,
    enum: ActivityApiMetric,
  })
  @ApiQuery({
    name: 'interval',
    description: `Activity Interval: e.g ${ActivityInterval.Week}`,
    enum: ActivityInterval,
  })
  @Get('/:metric')
  async totals(
    @Param(ContractContextPipe) context: ContractContext,
    @Param('metric', ActivityApiMetricPipe)
    service: ActivityApiMetricService<ActivityApiMetric>,
    @Query('interval') interval: ActivityInterval,
  ): Promise<TotalMetric> {
    return service.getActivity(context, interval);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'metric',
    description: `Total Metric: e.g ${DaoStatsMetric.DaoCount}`,
    enum: ActivityApiMetric,
  })
  @ApiQuery({
    name: 'interval',
    description: `Activity Interval: e.g ${ActivityInterval.Week}`,
    enum: ActivityInterval,
  })
  @Get('/:metric/history')
  async history(
    @Param(ContractContextPipe) context: ContractContext,
    @Param('metric', ActivityApiMetricPipe)
    service: ActivityApiMetricService<ActivityApiMetric>,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
    @Query('interval') interval: ActivityInterval,
  ): Promise<MetricResponse> {
    return service.getHistory(context, metricQuery, interval);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'metric',
    description: `Total Metric: e.g ${DaoStatsMetric.DaoCount}`,
    enum: ActivityApiMetric,
  })
  @Get('/:metric/leaderboard')
  async leaderboard(
    @Param(ContractContextPipe) context: ContractContext,
    @Param('metric', ActivityApiMetricPipe)
    service: ActivityApiMetricService<ActivityApiMetric>,
  ): Promise<LeaderboardMetricResponse> {
    return service.getLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: TotalMetric,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'metric',
    description: `Activity Metric: e.g ${ActivityApiMetric.DaoActivity}`,
    enum: ActivityApiMetric,
  })
  @ApiQuery({
    name: 'interval',
    description: `Activity Interval: e.g ${ActivityInterval.Week}`,
    enum: ActivityInterval,
  })
  @Get('/:metric/:dao')
  async daoTotals(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Param('metric', ActivityApiMetricPipe)
    service: ActivityApiMetricService<ActivityApiMetric>,
    @Query('interval') interval: ActivityInterval,
  ): Promise<TotalMetric> {
    return service.getActivity(context, interval);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'metric',
    description: `Activity Metric: e.g ${ActivityApiMetric.DaoActivity}`,
    enum: ActivityApiMetric,
  })
  @ApiQuery({
    name: 'interval',
    description: `Activity Interval: e.g ${ActivityInterval.Week}`,
    enum: ActivityInterval,
  })
  @Get('/:metric/:dao/history')
  async daoHistory(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Param('metric', ActivityApiMetricPipe)
    service: ActivityApiMetricService<ActivityApiMetric>,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
    @Query('interval') interval: ActivityInterval,
  ): Promise<MetricResponse> {
    return service.getHistory(context, metricQuery, interval);
  }
}
