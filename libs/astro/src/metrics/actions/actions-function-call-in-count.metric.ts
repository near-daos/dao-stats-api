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
export class ActionsFunctionCallInCountMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsFunctionCallInCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return this.nearIndexerService.getReceiptActionsFunctionCallCount({
      receiverAccountId: contract.contractId,
    });
  }

  async getHistorical({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getReceiptActionsFunctionCallCountDaily({
      receiverAccountId: contract.contractId,
    });
  }
}
