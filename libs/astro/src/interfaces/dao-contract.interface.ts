import { Contract } from 'near-api-js';
import {
  BountiesResponse,
  PolicyResponse,
  ProposalsResponse,
  ConfigResponse,
} from '../types';

export interface DaoContractInterface extends Contract {
  get_policy(): Promise<PolicyResponse>;
  get_proposals(args: {
    from_index?: number;
    limit?: number;
  }): Promise<ProposalsResponse>;
  get_last_proposal_id(): Promise<number>;
  get_bounties(args: {
    from_index?: number;
    limit?: number;
  }): Promise<BountiesResponse>;
  get_last_bounty_id(): Promise<number>;
  get_config(): Promise<ConfigResponse>;
}
