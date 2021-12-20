import { ApiProperty } from '@nestjs/swagger';

export class ContractResponse {
  @ApiProperty()
  contractId: string;

  @ApiProperty()
  contractName: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  conversionFactor: number;
}
