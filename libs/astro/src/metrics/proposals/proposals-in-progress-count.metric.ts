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
export class ProposalsInProgressCountMetric
  implements DaoContractMetricInterface
{
  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsInProgressCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (await contract.getProposalsByStatus(ProposalStatus.InProgress))
      .length;
  }

  async getHistorical({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
