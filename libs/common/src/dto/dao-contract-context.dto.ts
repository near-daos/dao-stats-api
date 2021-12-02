import { ApiProperty } from '@nestjs/swagger';
import { ContractContext } from './contract-context.dto';

export class DaoContractContext extends ContractContext {
  @ApiProperty()
  dao: string;
}
