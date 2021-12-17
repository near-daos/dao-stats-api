import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContractResponse } from './dto/contract.dto';
import { ContractService } from './contract.service';
import { HttpCacheInterceptor } from '@dao-stats/common';

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
  @UseInterceptors(HttpCacheInterceptor)
  @Get()
  async contracts(): Promise<ContractResponse[]> {
    return this.contractService.find();
  }
}
