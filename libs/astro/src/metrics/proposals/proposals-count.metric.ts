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
export class ProposalsCountMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (await contract.getProposals()).length;
  }

  async getHistorical({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getProposalsCountDaily(contract.contractId);
  }
}
