import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { FlowService } from './flow.service';
import { FlowTotalResponse } from './dto/flow-total.dto';

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
  async total(@Param() context: ContractContext): Promise<FlowTotalResponse> {
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
  async daoTotal(
    @Param() context: DaoContractContext,
  ): Promise<FlowTotalResponse> {
    return this.flowService.totals(context);
  }
}
