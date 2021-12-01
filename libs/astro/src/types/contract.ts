import { Contract as NearContract } from 'near-api-js';
import { PolicyResponse } from '@dao-stats/astro/types/policy-response';

export interface Contract extends NearContract {
  get_policy(): Promise<PolicyResponse>;
}
