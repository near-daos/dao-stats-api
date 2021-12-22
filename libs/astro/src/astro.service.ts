import { Near } from 'near-api-js';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';

import { NEAR_PROVIDER } from '@dao-stats/near';
import {
  DaoContract,
  DaoFactoryContract,
  TokenFactoryContract,
} from './contracts';

@Injectable()
export class AstroService {
  constructor(
    private readonly config: ConfigService,
    @Inject(NEAR_PROVIDER)
    private readonly near: Near,
  ) {}

  async getDaoFactoryContract(): Promise<DaoFactoryContract> {
    const { contractName } = this.config.get('dao');
    const account = await this.near.account(contractName);
    return new DaoFactoryContract(account, contractName);
  }

  async getTokenFactoryContract(): Promise<TokenFactoryContract> {
    const { tokenFactoryContractName } = this.config.get('dao');
    const account = await this.near.account(tokenFactoryContractName);
    return new TokenFactoryContract(account, tokenFactoryContractName);
  }

  async getDaoContract(contractName: string): Promise<DaoContract> {
    const account = await this.near.account(contractName);
    return new DaoContract(account, contractName);
  }

  async getDaoContracts(): Promise<DaoContract[]> {
    const factoryContract = await this.getDaoFactoryContract();
    const daos = await factoryContract.getDaoList();
    return Promise.all(daos.map((dao) => this.getDaoContract(dao)));
  }
}
