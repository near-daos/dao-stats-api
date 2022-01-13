import { Contract } from 'near-api-js';

export interface TokenFactoryContractInterface extends Contract {
  get_required_deposit(): Promise<any>;
  get_number_of_tokens(): Promise<any>;
  get_tokens(): Promise<any>;
  get_token(): Promise<any>;
}
