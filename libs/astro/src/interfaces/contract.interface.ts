import { Contract as NearContract } from 'near-api-js';
import { PolicyResponse, ProposalsResponse } from '../types';

export interface ContractInterface extends NearContract {
  get_policy(): Promise<PolicyResponse>;
  get_proposals(args: {
    from_index: number;
    limit: number;
  }): Promise<ProposalsResponse>;
  get_last_proposal_id(): Promise<number>;
}
