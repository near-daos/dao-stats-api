import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricQueryPipe,
  MetricResponse,
  LeaderboardMetricResponse,
  HttpCacheInterceptor,
} from '@dao-stats/common';

import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { GovernanceTotalResponse } from './dto/governance-total.dto';
import { ProposalsTypesLeaderboardResponse } from './dto/proposals-types-leaderboard-response.dto';
import { ProposalsTypesHistoryResponse } from './dto/proposals-types-history-response.dto';
import { VoteRateLeaderboardResponse } from './dto/vote-rate-leaderboard-response.dto';
import { GovernanceService } from './governance.service';

@ApiTags('Governance')
@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @ApiResponse({
    status: 200,
    type: GovernanceTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/')
  async totals(
    @Param() context: ContractContext,
  ): Promise<GovernanceTotalResponse> {
    return this.governanceService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/proposals')
  async proposals(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.governanceService.proposals(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/proposals/leaderboard')
  async proposalsLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.governanceService.proposalsLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: ProposalsTypesHistoryResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/proposals-types')
  async proposalsTypes(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    return this.governanceService.proposalsTypes(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: ProposalsTypesLeaderboardResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/proposals-types/leaderboard')
  async proposalsTypesLeaderboard(
    @Param() context: ContractContext,
  ): Promise<ProposalsTypesLeaderboardResponse> {
    return this.governanceService.proposalsTypesLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/vote-rate')
  async rate(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.governanceService.voteRate(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/vote-rate/leaderboard')
  async rateLeaderboard(
    @Param() context: ContractContext,
  ): Promise<VoteRateLeaderboardResponse> {
    return this.governanceService.voteRateLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: GovernanceTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/:dao')
  async daoTotals(
    @Param() context: DaoContractContext,
  ): Promise<GovernanceTotalResponse> {
    return this.governanceService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/:dao/proposals')
  async daoProposals(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.governanceService.proposals(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: ProposalsTypesHistoryResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/:dao/proposals-types')
  async daoProposalsTypes(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<ProposalsTypesHistoryResponse> {
    return this.governanceService.proposalsTypes(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor, ContractInterceptor)
  @Get('/:dao/vote-rate')
  async daoRate(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.governanceService.voteRate(context, metricQuery);
  }
}
