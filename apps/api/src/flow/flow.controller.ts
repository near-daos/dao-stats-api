import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  DaoContractContext,
  MetricQuery,
  MetricQueryPipe,
} from '@dao-stats/common';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { FlowService } from './flow.service';
import { FlowMetricResponse } from './dto/flow-metric-response.dto';
import { FlowContractContextQueryPipe } from 'libs/receipt/src/pipes/flow-contract-context-query.pipe';
import { FlowLeaderboardMetricResponse } from './dto/flow-leaderboard-metric-response.dto';
import { FlowMetricType } from 'libs/receipt/src/types/flow-metric-type';

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
  @UseInterceptors(ContractInterceptor)
  @Get('/')
  async totals(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
  ): Promise<FlowTotalResponse> {
    return this.flowService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/funds')
  async funds(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(context, FlowMetricType.Fund, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: FlowLeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/funds/leaderboard')
  async fundsLeaderboard(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
  ): Promise<FlowLeaderboardMetricResponse> {
    return this.flowService.leaderboard(context, FlowMetricType.Fund);
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/transactions')
  async transactions(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(
      context,
      FlowMetricType.Transaction,
      metricQuery,
    );
  }

  @ApiResponse({
    status: 200,
    type: FlowLeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/transactions/leaderboard')
  async transactionsLeaderboard(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
  ): Promise<FlowLeaderboardMetricResponse> {
    return this.flowService.leaderboard(context, FlowMetricType.Transaction);
  }

  @ApiResponse({
    status: 200,
    type: FlowTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao')
  async daoTotals(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
  ): Promise<FlowTotalResponse> {
    return this.flowService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao/funds')
  async daoFunds(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(context, FlowMetricType.Fund, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: FlowMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao/transactions')
  async daoTransactions(
    @Param(FlowContractContextQueryPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.flowService.history(
      context,
      FlowMetricType.Transaction,
      metricQuery,
    );
  }
}
