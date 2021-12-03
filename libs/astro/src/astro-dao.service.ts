import { Near, Contract as NearContract } from 'near-api-js';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';

import { NEAR_PROVIDER } from '@dao-stats/near';
import { Dao } from '@dao-stats/common';
import { Contract, TokenContract, FactoryContract } from './types';

@Injectable()
export class AstroDaoService implements Dao {
  constructor(
    private readonly config: ConfigService,
    @Inject(NEAR_PROVIDER)
    private readonly near: Near,
  ) {}

  async getFactoryContract(): Promise<FactoryContract> {
    const { contractName } = this.config.get('dao');
    const account = await this.near.account(contractName);

    return new NearContract(account, contractName, {
      viewMethods: ['get_dao_list'],
      changeMethods: [],
    }) as FactoryContract;
  }

  async getTokenFactoryContract(): Promise<TokenContract> {
    const { tokenFactoryContractName } = this.config.get('dao');
    const account = await this.near.account(tokenFactoryContractName);

    return new NearContract(account, tokenFactoryContractName, {
      viewMethods: [
        'get_required_deposit',
        'get_number_of_tokens',
        'get_tokens',
        'get_token',
      ],
      changeMethods: ['create_token', 'storage_deposit'],
    }) as TokenContract;
  }

  async getContract(contractName: string): Promise<Contract> {
    const account = await this.near.account(contractName);

    return new NearContract(account, contractName, {
      viewMethods: [
        'get_config',
        'get_policy',
        'get_staking_contract',
        'get_available_amount',
        'delegation_total_supply',
        'get_last_proposal_id',
        'get_proposals',
        'get_proposal',
        'get_last_bounty_id',
        'get_bounties',
        'get_bounty_claims',
        'get_bounty_number_of_claims',
      ],
      changeMethods: ['add_proposal', 'act_proposal'],
    }) as Contract;
  }

  public async getContracts(): Promise<Contract[]> {
    const factoryContract = await this.getFactoryContract();
    const daos = await factoryContract.get_dao_list();
    return Promise.all(daos.map((dao) => this.getContract(dao)));
  }
}
