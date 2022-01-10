import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { yoctoToNear } from '@dao-stats/astro';

@Injectable()
export class AccountBalanceMetric implements DaoContractMetricInterface {
  getType(): DaoStatsMetric {
    return DaoStatsMetric.AccountBalance;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const state = await contract.account.state();
    return yoctoToNear(state.amount);
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
