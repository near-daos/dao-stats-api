import { Near, Contract } from 'near-api-js';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';

import { NEAR_PROVIDER } from '@dao-stats/near';
import { Dao } from '@dao-stats/common';
import {
  ContractInterface,
  TokenContractInterface,
  FactoryContractInterface,
} from './interfaces';

@Injectable()
export class AstroDaoService implements Dao {
  constructor(
    private readonly config: ConfigService,
    @Inject(NEAR_PROVIDER)
    private readonly near: Near,
  ) {}

  async getFactoryContract(): Promise<FactoryContractInterface> {
    const { contractName } = this.config.get('dao');
    const account = await this.near.account(contractName);

    return new Contract(account, contractName, {
      viewMethods: ['get_dao_list'],
      changeMethods: [],
    }) as FactoryContractInterface;
  }

  async getTokenFactoryContract(): Promise<TokenContractInterface> {
    const { tokenFactoryContractName } = this.config.get('dao');
    const account = await this.near.account(tokenFactoryContractName);

    return new Contract(account, tokenFactoryContractName, {
      viewMethods: [
        'get_required_deposit',
        'get_number_of_tokens',
        'get_tokens',
        'get_token',
      ],
      changeMethods: ['create_token', 'storage_deposit'],
    }) as TokenContractInterface;
  }

  async getContract(contractName: string): Promise<ContractInterface> {
    const account = await this.near.account(contractName);

    return new Contract(account, contractName, {
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
    }) as ContractInterface;
  }

  public async getContracts(): Promise<ContractInterface[]> {
    const factoryContract = await this.getFactoryContract();
    const daos = await factoryContract.get_dao_list();
    return Promise.all(daos.map((dao) => this.getContract(dao)));
  }
}
