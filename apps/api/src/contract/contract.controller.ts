import { Controller, Get } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContractResponse } from './dto/contract.dto';
import { ContractService } from './contract.service';
import { NoContractContext } from '../decorators/no-contract-context.decorator';

@ApiTags('Contracts')
@Controller('/api/v1/contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @ApiResponse({
    status: 200,
    type: [ContractResponse],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @NoContractContext()
  @Get()
  async contracts(): Promise<ContractResponse[]> {
    return this.contractService.find();
  }
}
