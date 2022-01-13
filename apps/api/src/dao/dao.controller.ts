import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ContractContext,
  DaoContractContext,
  DaoDto,
  DaoService,
} from '@dao-stats/common';
import { HasDaoContractContext } from '../decorators';

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
  @Get()
  async daos(@Param() context: ContractContext): Promise<DaoDto[]> {
    const { contractId } = context;

    return this.daoService.find(contractId);
  }

  @ApiResponse({
    status: 200,
    type: DaoDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @HasDaoContractContext()
  @Get('/:dao')
  async dao(@Param() context: DaoContractContext): Promise<DaoDto> {
    const { contractId, dao } = context;

    const daoEntity = await this.daoService.findById(contractId, dao);

    if (!daoEntity) {
      throw new BadRequestException('Invalid Dao ID');
    }

    return daoEntity;
  }

  @ApiResponse({
    status: 200,
    type: [DaoDto],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @Get('/autocomplete/:input')
  async autocomplete(
    @Param() context: ContractContext,
    @Param('input') input: string,
  ): Promise<DaoDto[]> {
    const { contractId } = context;
    return this.daoService.autocomplete(contractId, input);
  }
}
