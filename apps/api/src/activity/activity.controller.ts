import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { ActivityTotalResponse } from './dto/activity-total.dto';
import { ActivityService } from './activity.service';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiResponse({
    status: 200,
    type: ActivityTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/')
  async total(
    @Param() context: DaoContractContext,
  ): Promise<ActivityTotalResponse> {
    return this.activityService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: ActivityTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/:dao')
  async daoTotal(
    @Param() context: DaoContractContext,
  ): Promise<ActivityTotalResponse> {
    return this.activityService.totals(context);
  }
}
