import { Contract, DaoContractContext } from '@dao-stats/common';
import { RequestContext } from '@medibloc/nestjs-request-context';
import { Injectable } from '@nestjs/common';
import { HasContractContext } from '../interceptors/contract-context.interface';

@Injectable()
export class ContractContextService implements HasContractContext {
  public getContext(): DaoContractContext {
    return RequestContext.get();
  }

  public getContract(): Contract {
    return this.getContext()?.contract;
  }
}
