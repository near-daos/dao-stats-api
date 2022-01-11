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
export class ActionsDepositInCountMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositInCount;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return this.nearIndexerService.getReceiptActionsDepositCount({
      receiverAccountId: contract.contractId,
    });
  }

  async getHistoricalValues({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getReceiptActionsDepositCountDaily({
      receiverAccountId: contract.contractId,
    });
  }
}
