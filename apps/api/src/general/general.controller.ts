import { MetricRequest } from '@dao-stats/common/dto/metric-request.dto';
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantInterceptor } from '../interceptors/tenant.interceptor';
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
  async total(@Param() request: MetricRequest): Promise<GeneralTotalResponse> {
    return this.generalService.totals(request);
  }
}
