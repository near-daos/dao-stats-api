import { Contract } from 'near-api-js';

export interface FactoryContractInterface extends Contract {
  get_dao_list(): Promise<string[]>;
}
