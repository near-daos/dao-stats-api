import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { DaoContractContext } from '@dao-stats/common';
import { ContractService } from 'apps/api/src/contract/contract.service';

@Injectable()
export class FlowContractContextQueryPipe implements PipeTransform {
  constructor(private contractService: ContractService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(context: DaoContractContext, metadata: ArgumentMetadata) {
    const { dao, contract } = context;

    let contractContext = context as DaoContractContext;
    if (!dao) {
      const { contractName: dao } = await this.contractService.findById(
        contract,
      );

      contractContext = {
        ...context,
        dao,
      };
    }

    return contractContext;
  }
}
