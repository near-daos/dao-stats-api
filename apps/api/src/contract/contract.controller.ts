import { Controller, Get } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContractDto, ContractService } from '@dao-stats/common';
import { NoContractContext } from '../decorators';

@ApiTags('Contracts')
@Controller('/api/v1/contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @ApiResponse({
    status: 200,
    type: [ContractDto],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @NoContractContext()
  @Get()
  async contracts(): Promise<ContractDto[]> {
    return this.contractService.find();
  }
}
