import { Account, Contract } from 'near-api-js';
import { ContractMethods } from 'near-api-js/lib/contract';
import { BountiesResponse, ProposalsResponse } from '../types';
import { DaoContractInterface } from '../interfaces';

// enable typings for dynamic methods
const Base: {
  new (
    account: Account,
    contractId: string,
    options: ContractMethods,
  ): DaoContractInterface;
} = Contract as any;

export class DaoContract extends Base {
  constructor(account: Account, contractId: string) {
    super(account, contractId, {
      viewMethods: [
        'get_config',
        'get_policy',
        'get_staking_contract',
        'get_available_amount',
        'delegation_total_supply',
        'get_last_proposal_id',
        'get_proposals',
        'get_proposal',
        'get_last_bounty_id',
        'get_bounties',
        'get_bounty_claims',
        'get_bounty_number_of_claims',
      ],
      changeMethods: ['add_proposal', 'act_proposal'],
    });
  }

  async getProposalsChunked(chunkSize = 200): Promise<ProposalsResponse> {
    const lastProposalId = await this.get_last_proposal_id();
    const promises: Promise<ProposalsResponse>[] = [];
    for (let i = 0; i <= lastProposalId; i += chunkSize) {
      promises.push(this.get_proposals({ from_index: i, limit: chunkSize }));
    }
    return (await Promise.all(promises)).flat();
  }

  async getBountiesChunked(chunkSize = 200): Promise<BountiesResponse> {
    const lastBountyId = await this.get_last_bounty_id();
    const promises: Promise<BountiesResponse>[] = [];
    for (let i = 0; i < lastBountyId; i += chunkSize) {
      promises.push(this.get_bounties({ from_index: i, limit: chunkSize }));
    }
    return (await Promise.all(promises)).flat();
  }
}
