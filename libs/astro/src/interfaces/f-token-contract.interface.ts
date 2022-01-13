import { Contract } from 'near-api-js';
import { FTokenMetadataResponse } from '../types';

export interface FTokenContractInterface extends Contract {
  ft_balance_of(args: { account_id: string }): Promise<string>;
  ft_metadata(): Promise<FTokenMetadataResponse>;
  ft_total_supply(): Promise<string>;
}
