import { Account, Contract } from 'near-api-js';
import { ContractMethods } from 'near-api-js/lib/contract';
import { Cacheable } from '@type-cacheable/core';
import { FTokenContractInterface } from '../interfaces';
import { FTokenMetadataResponse } from '../types';

// enable typings for dynamic methods
const Base: {
  new (
    account: Account,
    contractId: string,
    options: ContractMethods,
  ): FTokenContractInterface;
} = Contract as any;

export class FTokenContract extends Base {
  constructor(account: Account, contractId: string) {
    super(account, contractId, {
      viewMethods: ['ft_balance_of', 'ft_metadata', 'ft_total_supply'],
      changeMethods: [],
    });
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: ([accountId], context) =>
      `ft-balance:${context.contractId}:${accountId}`,
  })
  async getBalance(accountId: string): Promise<string> {
    return this.ft_balance_of({ account_id: accountId });
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: (args, context) => `ft-metadata:${context.contractId}`,
  })
  async getMetadata(): Promise<FTokenMetadataResponse> {
    return this.ft_metadata();
  }
}
