import { Account, Contract } from 'near-api-js';
import { ContractMethods } from 'near-api-js/lib/contract';
import { Cacheable } from '@type-cacheable/core';
import {
  BountiesResponse,
  Policy,
  Proposal,
  ProposalKind,
  ProposalsResponse,
  ProposalStatus,
  Role,
  Config,
} from '../types';
import { DaoContractInterface } from '../interfaces';
import { isRoleGroup } from '../utils';

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

  async getPolicy(): Promise<Policy> {
    return this.get_policy();
  }

  async getConfig(): Promise<Config> {
    return this.get_config();
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: (args, context) => `groups:${context.contractId}`,
  })
  async getGroups(): Promise<Role[]> {
    const policy = await this.get_policy();
    return policy.roles.filter(isRoleGroup);
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: (args, context) => `proposals:${context.contractId}`,
  })
  async getProposals(chunkSize = 200): Promise<ProposalsResponse> {
    const lastProposalId = await this.get_last_proposal_id();
    const promises: Promise<ProposalsResponse>[] = [];
    for (let i = 0; i <= lastProposalId; i += chunkSize) {
      promises.push(this.get_proposals({ from_index: i, limit: chunkSize }));
    }
    return (await Promise.all(promises)).flat();
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: (args, context) => `bounties:${context.contractId}`,
  })
  async getBounties(chunkSize = 200): Promise<BountiesResponse> {
    const lastBountyId = await this.get_last_bounty_id();
    const promises: Promise<BountiesResponse>[] = [];
    for (let i = 0; i < lastBountyId; i += chunkSize) {
      promises.push(this.get_bounties({ from_index: i, limit: chunkSize }));
    }
    return (await Promise.all(promises)).flat();
  }

  async getProposalsByStatus(status: ProposalStatus): Promise<Proposal[]> {
    const proposals = await this.getProposals();
    return proposals.filter((prop) => prop.status === status);
  }

  async getProposalsByKinds(kinds: ProposalKind[]): Promise<Proposal[]> {
    const proposals = await this.getProposals();
    return proposals.filter((prop) =>
      (Object.keys(prop.kind) as ProposalKind[]).some((kind) =>
        kinds.includes(kind),
      ),
    );
  }
}
