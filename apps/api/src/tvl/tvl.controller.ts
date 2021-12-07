import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ContractContext, DaoContractContext } from '@dao-stats/common';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { TvlTotalResponse } from './dto/tvl-total.dto';
import { TvlService } from './tvl.service';

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
  @UseInterceptors(ContractInterceptor)
  @Get('/')
  async total(@Param() context: ContractContext): Promise<TvlTotalResponse> {
    return this.tvlService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: TvlTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao')
  async daoTotal(
    @Param() context: DaoContractContext,
  ): Promise<TvlTotalResponse> {
    return this.tvlService.totals(context);
  }
}
