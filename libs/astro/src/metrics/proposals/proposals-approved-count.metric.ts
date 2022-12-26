import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { ProposalStatus } from '../../types';

@Injectable()
export class ProposalsApprovedCountMetric
  implements DaoContractMetricInterface
{
  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsApprovedCount;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (
      await contract.getProposalsBy({
        statuses: [ProposalStatus.Approved],
      })
    ).length;
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
