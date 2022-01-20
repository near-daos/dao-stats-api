import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { ProposalKind } from '../../types';

@Injectable()
export class ProposalsPolicyChangeCountMetric
  implements DaoContractMetricInterface
{
  getType(): DaoStatsMetric {
    return DaoStatsMetric.ProposalsPolicyChangeCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (await contract.getProposalsByKinds([ProposalKind.ChangePolicy]))
      .length;
  }

  async getHistorical({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
