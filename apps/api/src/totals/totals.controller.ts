import {
  ApiBadRequestResponse,
  ApiParam,
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
  DaoContractContext,
} from '@dao-stats/common';

import { ContractContextPipe, MetricQueryPipe } from '../pipes';
import { TotalApiMetricPipe } from './pipes/total-api-metric.pipe';
import { TotalApiMetricService } from './interfaces/total-api-metric.interface';
import { TotalApiMetric } from 'apps/api/src/totals/types/total-metric-type';

@ApiTags('Totals')
@Controller('totals')
export class TotalsController {
  @ApiResponse({
    status: 200,
    type: TotalMetric,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'metric',
    description: `Total Metric: e.g ${TotalApiMetric.DaoCount}`,
    enum: TotalApiMetric,
  })
  @Get('/:metric')
  async totals(
    @Param(ContractContextPipe) context: ContractContext,
    @Param('metric', TotalApiMetricPipe)
    service: TotalApiMetricService<TotalApiMetric>,
  ): Promise<TotalMetric> {
    return service.getTotal(context);
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
    description: `Total Metric: e.g ${TotalApiMetric.DaoCount}`,
    enum: TotalApiMetric,
  })
  @Get('/:metric/history')
  async history(
    @Param(ContractContextPipe) context: ContractContext,
    @Param('metric', TotalApiMetricPipe)
    service: TotalApiMetricService<TotalApiMetric>,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return service.getHistory(context, metricQuery);
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
    description: `Total Metric: e.g ${TotalApiMetric.DaoCount}`,
    enum: TotalApiMetric,
  })
  @Get('/:metric/leaderboard')
  async leaderboard(
    @Param(ContractContextPipe) context: ContractContext,
    @Param('metric', TotalApiMetricPipe)
    service: TotalApiMetricService<TotalApiMetric>,
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
    description: `Total Metric: e.g ${TotalApiMetric.DaoCount}`,
    enum: TotalApiMetric,
  })
  @Get('/:metric/:dao')
  async daoTotals(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Param('metric', TotalApiMetricPipe)
    service: TotalApiMetricService<TotalApiMetric>,
  ): Promise<TotalMetric> {
    return service.getTotal(context);
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
    description: `Total Metric: e.g ${TotalApiMetric.DaoCount}`,
    enum: TotalApiMetric,
  })
  @Get('/:metric/:dao/history')
  async daoHistory(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Param('metric', TotalApiMetricPipe)
    service: TotalApiMetricService<TotalApiMetric>,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return service.getHistory(context, metricQuery);
  }
}
