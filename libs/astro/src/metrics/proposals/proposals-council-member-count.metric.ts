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
export class ProposalsCouncilMemberCountMetric
  implements DaoContractMetricInterface
{
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsCouncilMemberCount;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const proposals = await contract.getProposals();
    const councilMembers = proposals.filter((prop) => {
      const kind =
        prop.kind[ProposalKind.AddMemberToRole] ||
        prop.kind[ProposalKind.RemoveMemberFromRole];
      return kind ? kind.role.toLowerCase() === 'council' : false;
    });
    return councilMembers.length;
  }

  async getHistoricalValues({
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    return this.nearIndexerService.getProposalsCountDaily(
      contract.contractId,
      [ProposalKind.AddMemberToRole, ProposalKind.RemoveMemberFromRole],
      'council',
    );
  }
}
