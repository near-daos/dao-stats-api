import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ContractContext,
  DaoContractContext,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
} from '@dao-stats/common';

import { TokensTotalResponse } from './dto';
import { TokensService } from './tokens.service';
import { ContractContextPipe, MetricQueryPipe } from '../pipes';
import { HasDaoContractContext } from '../decorators';

@ApiTags('Tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @ApiResponse({
    status: 200,
    type: TokensTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/')
  async totals(
    @Param(ContractContextPipe) context: ContractContext,
  ): Promise<TokensTotalResponse> {
    return this.tokensService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/fts')
  async fts(
    @Param(ContractContextPipe) context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.fts(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/fts/leaderboard')
  async ftsLeaderboard(
    @Param(ContractContextPipe) context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.tokensService.ftsLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/fts-vl')
  async ftsValueLocked(
    @Param(ContractContextPipe) context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.ftsValueLocked(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/fts-vl/leaderboard')
  async ftsValueLockedLeaderboard(
    @Param(ContractContextPipe) context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.tokensService.ftsValueLockedLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/nfts')
  async nfts(
    @Param(ContractContextPipe) context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.nfts(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/nfts/leaderboard')
  async nftsLeaderboard(
    @Param(ContractContextPipe) context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.tokensService.nftsLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: TokensTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao')
  async daoTotals(
    @Param(ContractContextPipe) context: DaoContractContext,
  ): Promise<TokensTotalResponse> {
    return this.tokensService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao/fts')
  async daoFts(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.fts(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao/fts-vl')
  async daoFtsValueLocked(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.ftsValueLocked(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao/nfts')
  async daoNfts(
    @Param(ContractContextPipe) context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.nfts(context, metricQuery);
  }
}
