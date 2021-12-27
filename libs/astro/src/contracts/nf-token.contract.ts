import { Account, Contract } from 'near-api-js';
import { ContractMethods } from 'near-api-js/lib/contract';
import { Cacheable } from '@type-cacheable/core';
import { NfTokenContractInterface } from '../interfaces';
import { NfTokenMetadataResponse, NfTokenForOwnerResponse } from '../types';

// enable typings for dynamic methods
const Base: {
  new (
    account: Account,
    contractId: string,
    options: ContractMethods,
  ): NfTokenContractInterface;
} = Contract as any;

export class NfTokenContract extends Base {
  constructor(account: Account, contractId: string) {
    super(account, contractId, {
      viewMethods: ['nft_tokens_for_owner', 'nft_metadata'],
      changeMethods: [],
    });
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: ([accountId], context) =>
      `nft-tokens-for-owner:${context.contractId}:${accountId}`,
  })
  async getTokensForOwner(
    accountId: string,
    chunkSize = 50 /* bigger chunks may cause GasLimitExceeded error */,
  ): Promise<NfTokenForOwnerResponse> {
    let nfts = [];
    let chunk = [];
    let fromIndex = 0;

    do {
      chunk = await this.nft_tokens_for_owner({
        account_id: accountId,
        from_index: String(fromIndex),
        limit: chunkSize,
      });
      fromIndex += chunkSize;
      nfts = nfts.concat(chunk);
    } while (chunk.length === chunkSize);

    return nfts;
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: (args, context) => `nft-metadata:${context.contractId}`,
  })
  async getMetadata(): Promise<NfTokenMetadataResponse> {
    return this.nft_metadata();
  }
}
