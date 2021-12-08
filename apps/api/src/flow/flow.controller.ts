import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ContractContext, DaoContractContext } from '@dao-stats/common';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { FlowService } from './flow.service';

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
  async totals(@Param() context: ContractContext): Promise<FlowTotalResponse> {
    return this.flowService.totals(context);
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
    @Param() context: DaoContractContext,
  ): Promise<FlowTotalResponse> {
    return this.flowService.totals(context);
  }
}
