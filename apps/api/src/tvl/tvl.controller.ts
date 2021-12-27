import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricResponse,
} from '@dao-stats/common';

import { TvlTotalResponse } from './dto/tvl-total.dto';
import { TvlBountiesLeaderboardResponse } from './dto/tvl-bounties-leaderboard-response.dto';
import { TvlService } from './tvl.service';
import { MetricQueryPipe } from '../pipes';
import { HasDaoContractContext } from '../decorators';

@ApiTags('TVL')
@Controller('tvl')
export class TvlController {
  constructor(private readonly tvlService: TvlService) {}

  @ApiResponse({
    status: 200,
    type: TvlTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/')
  async totals(@Param() context: ContractContext): Promise<TvlTotalResponse> {
    return this.tvlService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/bounties/number')
  async bountiesNumber(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tvlService.bountiesNumber(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/bounties/vl')
  async bountiesValueLocked(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tvlService.bountiesValueLocked(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: TvlBountiesLeaderboardResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/bounties/leaderboard')
  async groups(
    @Param() context: ContractContext,
  ): Promise<TvlBountiesLeaderboardResponse> {
    return this.tvlService.bountiesLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: TvlTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao')
  async daoTotals(
    @Param() context: DaoContractContext,
  ): Promise<TvlTotalResponse> {
    return this.tvlService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao/bounties/number')
  async daoBountiesNumber(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tvlService.bountiesNumber(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao/bounties/vl')
  async daoBountiesValueLocked(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.tvlService.bountiesValueLocked(context, metricQuery);
  }
}
