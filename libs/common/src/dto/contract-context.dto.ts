import { ApiProperty } from '@nestjs/swagger';

export class ContractContext {
  @ApiProperty()
  contract: string;
}
