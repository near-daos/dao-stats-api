import { Account, Contract } from 'near-api-js';
import { ContractMethods } from 'near-api-js/lib/contract';
import { TokenFactoryContractInterface } from '../interfaces';

// enable typings for dynamic methods
const Base: {
  new (
    account: Account,
    contractId: string,
    options: ContractMethods,
  ): TokenFactoryContractInterface;
} = Contract as any;

export class TokenFactoryContract extends Base {
  constructor(account: Account, contractId: string) {
    super(account, contractId, {
      viewMethods: [
        'get_required_deposit',
        'get_number_of_tokens',
        'get_tokens',
        'get_token',
      ],
      changeMethods: ['create_token', 'storage_deposit'],
    });
  }
}
