import { Near, Contract } from 'near-api-js';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';

import { NEAR_PROVIDER } from '@dao-stats/near';
import { DAO } from '@dao-stats/common/interfaces/dao.interface';

@Injectable()
export class AstroDAOService implements DAO {
  constructor(
    private readonly config: ConfigService,
    @Inject(NEAR_PROVIDER)
    private readonly near: Near,
  ) {}

  async getFactoryContract(): Promise<Contract> {
    const { contractName } = this.config.get('dao');
    const account = await this.near.account(contractName);

    return new Contract(account, contractName, {
      viewMethods: ['get_dao_list', 'tx_status'],
      changeMethods: [],
    });
  }

  async getTokenFactoryContract(): Promise<Contract> {
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
    });
  }

  async getContract(contractName: string): Promise<Contract> {
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
    });
  }
}
