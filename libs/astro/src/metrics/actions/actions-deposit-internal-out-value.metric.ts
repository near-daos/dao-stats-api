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
export class ActionsDepositInternalOutValueMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositInternalOutValue;
  }

  async getTotal({
    contract,
    factoryContract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const amount = await this.nearIndexerService.getReceiptActionsDepositAmount(
      {
        predecessorAccountId: contract.contractId,
        receiverAccountId: `%.${factoryContract.contractId}`,
        receiverAccountIdCond: 'like',
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
        predecessorAccountId: contract.contractId,
        receiverAccountId: `%.${factoryContract.contractId}`,
        receiverAccountIdCond: 'like',
      });
    return result.map(({ date, total, change }) => ({
      date,
      total: yoctoToNear(total),
      change: yoctoToNear(change),
    }));
  }
}
