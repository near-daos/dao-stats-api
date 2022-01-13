import { Contract } from 'near-api-js';

export interface DaoFactoryContractInterface extends Contract {
  get_dao_list(): Promise<string[]>;
  get_number_daos(): Promise<number>;
  get_daos(args: { from_index?: number; limit?: number }): Promise<string[]>;
}
