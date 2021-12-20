import { Account, Contract } from 'near-api-js';
import { TokenFactoryContractInterface } from '../interfaces';

const Base: { new (...args): TokenFactoryContractInterface } = Contract as any;

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
