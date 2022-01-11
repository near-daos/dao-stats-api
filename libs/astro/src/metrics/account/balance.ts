import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { yoctoToNear } from '../../utils';

@Injectable()
export class AccountBalanceMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.AccountBalance;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const state = await contract.account.state();
    return yoctoToNear(state.amount);
  }

  async getHistoricalValues({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    const result = await this.nearIndexerService.getAccountBalanceDaily(
      contract.contractId,
    );
    return result.map(({ date, value }) => ({
      date,
      value: yoctoToNear(value),
    }));
  }
}
