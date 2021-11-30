import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { TenantContext } from '@dao-stats/common/dto/tenant-context.dto';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantInterceptor } from '../interceptors/tenant.interceptor';
import { GeneralDaoResponse } from './dto/general-dao.dto';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { GeneralService } from './general.service';

@ApiTags('DAO')
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
  async total(@Param() request: TenantContext): Promise<GeneralTotalResponse> {
    return this.generalService.totals(request);
  }

  @ApiResponse({
    status: 200,
    type: GeneralDaoResponse,
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
    @Param() request: TenantContext,
    @Query() metricQuery: MetricQuery,
  ): Promise<GeneralDaoResponse> {
    return this.generalService.daos(request, metricQuery);
  }
}
