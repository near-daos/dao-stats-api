import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class ActionsDepositOutCountMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositOutCount;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return this.nearIndexerService.getReceiptActionsCount({
      predecessorAccountId: contract.contractId,
    });
  }

  async getHistoricalValues({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getReceiptActionsDepositCountDaily({
      predecessorAccountId: contract.contractId,
    });
  }
}
