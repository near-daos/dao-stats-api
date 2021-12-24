import { RequestContext } from '@medibloc/nestjs-request-context';
import { ApiProperty } from '@nestjs/swagger';
import { Contract } from '..';

export class ContractContext extends RequestContext {
  @ApiProperty()
  contractId: string;

  contract: Contract;
}
