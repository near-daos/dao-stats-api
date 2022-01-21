import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { ProposalKind } from '../../types';

@Injectable()
export class ProposalsBountyCountMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsBountyCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (
      await contract.getProposalsByKinds([
        ProposalKind.AddBounty,
        ProposalKind.BountyDone,
      ])
    ).length;
  }

  async getHistorical({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getProposalsCountDaily(contract.contractId, [
      ProposalKind.AddBounty,
      ProposalKind.BountyDone,
    ]);
  }
}
