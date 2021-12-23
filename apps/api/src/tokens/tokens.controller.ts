import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ContractContext,
  DaoContractContext,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
} from '@dao-stats/common';

import { TokensTotalResponse } from './dto/tokens-total.dto';
import { TokensService } from './tokens.service';
import { MetricQueryPipe } from '../pipes';

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
    @Param() context: ContractContext,
  ): Promise<TokensTotalResponse> {
    return this.tokensService.totals();
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/fts')
  async ftTokens(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.fts(metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/fts/leaderboard')
  async ftTokensLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.tokensService.ftsLeaderboard();
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/nfts')
  async nftTokens(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.nfts(metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/nfts/leaderboard')
  async nftTokensLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.tokensService.nftsLeaderboard();
  }

  @ApiResponse({
    status: 200,
    type: TokensTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao')
  async daoTotals(
    @Param() context: DaoContractContext,
  ): Promise<TokensTotalResponse> {
    return this.tokensService.totals();
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao/fts')
  async daoFtTokens(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.fts(metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao/nfts')
  async daoNftTokens(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tokensService.nfts(metricQuery);
  }
}
