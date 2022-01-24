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
export class ActionsDepositInternalInValueMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositInternalInValue;
  }

  async getTotal({
    contract,
    factoryContract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const amount = await this.nearIndexerService.getReceiptActionsDepositAmount(
      {
        receiverAccountId: contract.contractId,
        predecessorAccountId: `%.${factoryContract.contractId}`,
        predecessorAccountIdCond: 'like',
      },
    );
    return yoctoToNear(amount);
  }

  async getHistorical({
    contract,
    factoryContract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    const result =
      await this.nearIndexerService.getReceiptActionsDepositAmountDaily({
        receiverAccountId: contract.contractId,
        predecessorAccountId: `%.${factoryContract.contractId}`,
        predecessorAccountIdCond: 'like',
      });
    return result.map(({ date, total, change }) => ({
      date,
      total: yoctoToNear(total),
      change: yoctoToNear(change),
    }));
  }
}
