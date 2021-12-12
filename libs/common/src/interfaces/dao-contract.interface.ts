import { Contract } from 'near-api-js';

export interface DaoContract {
  getFactoryContract(): Promise<Contract>;
  getTokenFactoryContract(): Promise<Contract>;
  getContract(contractId: string): Promise<Contract>;
  getContracts(): Promise<Contract[]>;
}
