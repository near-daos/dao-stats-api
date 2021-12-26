import { Contract } from 'near-api-js';
import {
  NfTokenMetadataResponse,
  NfTokenForOwnerResponse,
} from '@dao-stats/astro/types';

export interface NfTokenContractInterface extends Contract {
  nft_tokens_for_owner(args: {
    account_id: string;
    from_index?: string;
    limit?: number;
  }): Promise<NfTokenForOwnerResponse>;
  nft_metadata(): Promise<NfTokenMetadataResponse>;
}
