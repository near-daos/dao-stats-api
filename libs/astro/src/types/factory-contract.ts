import { Contract } from 'near-api-js';

export interface FactoryContract extends Contract {
  get_dao_list(): Promise<string[]>;
}
