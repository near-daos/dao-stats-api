import { Near, Contract } from 'near-api-js';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import PromisePool from '@supercharge/promise-pool';

import { NEAR_PROVIDER } from '@dao-stats/near';
import { Dao } from '@dao-stats/common';
import {
  ContractInterface,
  TokenContractInterface,
  FactoryContractInterface,
} from './interfaces';

@Injectable()
export class AstroDaoService implements Dao {
  private readonly logger = new Logger(AstroDaoService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(NEAR_PROVIDER)
    private readonly near: Near,
  ) {}

  async getFactoryContract(): Promise<FactoryContractInterface> {
    const { contractName } = this.config.get('dao');
    const account = await this.near.account(contractName);

    return new Contract(account, contractName, {
      viewMethods: ['get_dao_list', 'get_number_daos', 'get_daos'],
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

    let daos = [];
    try {
      daos = await factoryContract.get_dao_list();
    } catch (e) {
      // Considering 'UntypedError' as a blockchain FunctionCall error
      if (e.type !== 'UntypedError') {
        throw new Error(e);
      }

      const daoCount = await factoryContract.get_number_daos();

      const chunkSize = 100;
      const chunkCount = (daoCount - (daoCount % chunkSize)) / chunkSize + 1;
      const { results } = await PromisePool.withConcurrency(1)
        .for([...Array(chunkCount).keys()])
        .handleError((e) => this.logger.error(e))
        .process(
          async (offset) =>
            await factoryContract.get_daos({
              from_index: offset * chunkSize,
              limit: chunkSize,
            }),
        );

      daos = results.flat();
    }

    return Promise.all(daos.map((dao) => this.getContract(dao)));
  }
}
