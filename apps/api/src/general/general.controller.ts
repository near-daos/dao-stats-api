import { DaoTenantContext } from '@dao-stats/common/dto/dao-tenant-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { TenantContext } from '@dao-stats/common/dto/tenant-context.dto';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantInterceptor } from '../interceptors/tenant.interceptor';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { GeneralService } from './general.service';

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
  @UseInterceptors(TenantInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/')
  async total(
    @Param() context: DaoTenantContext,
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
  @UseInterceptors(TenantInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/daos')
  async daos(
    @Param() context: TenantContext,
    @Query() metricQuery: MetricQuery,
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
  @UseInterceptors(TenantInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/activity')
  async activity(
    @Param() context: TenantContext,
    @Query() metricQuery: MetricQuery,
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
  @UseInterceptors(TenantInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/activity/leaderboard')
  async activityLeaderboard(
    @Param() context: TenantContext,
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
  @UseInterceptors(TenantInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/:dao')
  async daoTotal(
    @Param() context: DaoTenantContext,
  ): Promise<GeneralTotalResponse> {
    return this.generalService.totals(context);
  }
}
