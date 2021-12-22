import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ContractContext,
  DaoContractContext,
  DaoDto,
  DaoService,
  HttpCacheInterceptor,
} from '@dao-stats/common';

@ApiTags('DAOs')
@Controller('daos')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @ApiResponse({
    status: 200,
    type: [DaoDto],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor)
  @Get()
  async daos(@Param() context: ContractContext): Promise<DaoDto[]> {
    const { contract } = context;

    return this.daoService.find(contract);
  }

  @ApiResponse({
    status: 200,
    type: DaoDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor)
  @Get('/:dao')
  async dao(@Param() context: DaoContractContext): Promise<DaoDto> {
    const { contract, dao } = context;
    return this.daoService.findById(contract, dao);
  }

  @ApiResponse({
    status: 200,
    type: [DaoDto],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(HttpCacheInterceptor)
  @Get('/autocomplete/:input')
  async autocomplete(
    @Param() context: ContractContext,
    @Param('input') input: string,
  ): Promise<DaoDto[]> {
    const { contract } = context;
    return this.daoService.autocomplete(contract, input);
  }
}
