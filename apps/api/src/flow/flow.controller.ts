import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import { DaoContractContext, MetricQuery } from '@dao-stats/common';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { FlowService } from './flow.service';
import { FlowMetricResponse } from './dto/flow-metric-response.dto';
import { FlowLeaderboardMetricResponse } from './dto/flow-leaderboard-metric-response.dto';
import { FlowMetricType } from 'libs/receipt/src/types/flow-metric-type';
import { MetricQueryPipe } from '../pipes';

@ApiTags('Flow')
@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @ApiResponse({
    status: 200,
    type: FlowTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/')
  async totals(
    @Param() context: DaoContractContext,
  ): Promise<FlowTotalResponse> {
    return this.flowService.totals();
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/funds')
  async funds(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(FlowMetricType.Fund, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: FlowLeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/funds/leaderboard')
  async fundsLeaderboard(
    @Param() context: DaoContractContext,
  ): Promise<FlowLeaderboardMetricResponse> {
    return this.flowService.leaderboard(FlowMetricType.Fund);
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/transactions')
  async transactions(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(FlowMetricType.Transaction, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: FlowLeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/transactions/leaderboard')
  async transactionsLeaderboard(
    @Param() context: DaoContractContext,
  ): Promise<FlowLeaderboardMetricResponse> {
    return this.flowService.leaderboard(FlowMetricType.Transaction);
  }

  @ApiResponse({
    status: 200,
    type: FlowTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao')
  async daoTotals(
    @Param() context: DaoContractContext,
  ): Promise<FlowTotalResponse> {
    return this.flowService.totals();
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao/funds')
  async daoFunds(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(FlowMetricType.Fund, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao/transactions')
  async daoTransactions(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(FlowMetricType.Transaction, metricQuery);
  }
}
