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
export class ActionsDepositInValueMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositInValue;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const amount = await this.nearIndexerService.getReceiptActionsDepositAmount(
      {
        receiverAccountId: contract.contractId,
      },
    );
    return yoctoToNear(amount);
  }

  async getHistoricalValues({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    const result =
      await this.nearIndexerService.getReceiptActionsDepositAmountDaily({
        receiverAccountId: contract.contractId,
      });
    return result.map(({ date, value }) => ({
      date,
      value: yoctoToNear(value),
    }));
  }
}
