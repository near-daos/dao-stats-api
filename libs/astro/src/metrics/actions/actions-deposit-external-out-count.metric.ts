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
export class ActionsDepositExternalOutCountMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ActionsDepositExternalOutCount;
  }

  async getTotal({
    contract,
    factoryContract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return this.nearIndexerService.getReceiptActionsCount({
      predecessorAccountId: contract.contractId,
      receiverAccountId: `%.${factoryContract.contractId}`,
      receiverAccountIdCond: 'not like',
    });
  }

  async getHistorical({
    contract,
    factoryContract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getReceiptActionsDepositCountDaily({
      predecessorAccountId: contract.contractId,
      receiverAccountId: `%.${factoryContract.contractId}`,
      receiverAccountIdCond: 'not like',
    });
  }
}
