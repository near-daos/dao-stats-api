import { Account, Contract } from 'near-api-js';
import { ContractMethods } from 'near-api-js/lib/contract';
import { DaoFactoryContractInterface } from '../interfaces';

// enable typings for dynamic methods
const Base: {
  new (
    account: Account,
    contractId: string,
    options: ContractMethods,
  ): DaoFactoryContractInterface;
} = Contract as any;

export class DaoFactoryContract extends Base {
  constructor(account: Account, contractId: string) {
    super(account, contractId, {
      viewMethods: ['get_dao_list', 'get_number_daos', 'get_daos'],
      changeMethods: [],
    });
  }

  async getDaoListChunked(chunkSize = 200): Promise<string[]> {
    const lastProposalId = await this.get_number_daos();
    const promises: Promise<string[]>[] = [];
    for (let i = 0; i <= lastProposalId; i += chunkSize) {
      promises.push(this.get_daos({ from_index: i, limit: chunkSize }));
    }
    return (await Promise.all(promises)).flat();
  }
}
