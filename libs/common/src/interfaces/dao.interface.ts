import { Contract } from 'near-api-js';

export interface DAO {
  getFactoryContract(): Promise<Contract>;
  getTokenFactoryContract(): Promise<Contract>;
  getContract(contractId: string): Promise<Contract>;
}
