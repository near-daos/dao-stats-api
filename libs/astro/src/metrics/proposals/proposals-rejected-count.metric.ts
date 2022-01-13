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
export class ProposalsRejectedCountMetric
  implements DaoContractMetricInterface
{
  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsRejectedCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (await contract.getProposalsByStatus(ProposalStatus.Rejected))
      .length;
  }

  async getHistorical({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
