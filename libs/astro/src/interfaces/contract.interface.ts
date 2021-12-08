import { Contract as NearContract } from 'near-api-js';
import { BountyResponse, PolicyResponse, ProposalsResponse } from '../types';

export interface ContractInterface extends NearContract {
  get_policy(): Promise<PolicyResponse>;
  get_proposals(args: {
    from_index: number;
    limit: number;
  }): Promise<ProposalsResponse>;
  get_last_proposal_id(): Promise<number>;
  get_bounties(args: {
    from_index: number;
    limit: number;
  }): Promise<BountyResponse>;
  get_last_bounty_id(): Promise<number>;
}
