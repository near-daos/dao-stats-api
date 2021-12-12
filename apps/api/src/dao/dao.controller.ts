import { Controller, Get, Param } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ContractContext,
  DaoContractContext,
  DaoResponse,
  DaoService,
} from '@dao-stats/common';

@ApiTags('DAOs')
@Controller('daos')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @ApiResponse({
    status: 200,
    type: [DaoResponse],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get()
  async daos(@Param() context: ContractContext): Promise<DaoResponse[]> {
    const { contract } = context;

    return this.daoService.find(contract);
  }

  @ApiResponse({
    status: 200,
    type: DaoResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/:dao')
  async dao(@Param() context: DaoContractContext): Promise<DaoResponse> {
    const { contract, dao } = context;
    return this.daoService.findById(contract, dao);
  }

  @ApiResponse({
    status: 200,
    type: [DaoResponse],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/autocomplete/:input')
  async autocomplete(
    @Param() context: ContractContext,
    @Param('input') input: string,
  ): Promise<DaoResponse[]> {
    const { contract } = context;
    return this.daoService.autocomplete(contract, input);
  }
}