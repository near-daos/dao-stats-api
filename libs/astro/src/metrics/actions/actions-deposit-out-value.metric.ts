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
export class ActionsDepositOutValueMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositOutValue;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const amount = await this.nearIndexerService.getReceiptActionsDepositAmount(
      {
        predecessorAccountId: contract.contractId,
      },
    );
    return yoctoToNear(amount);
  }

  async getHistorical({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    const result =
      await this.nearIndexerService.getReceiptActionsDepositAmountDaily({
        predecessorAccountId: contract.contractId,
      });
    return result.map(({ date, total }) => ({
      date,
      total: yoctoToNear(total),
    }));
  }
}
