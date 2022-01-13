import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { isRoleGroupCouncil } from '../../utils';

@Injectable()
export class CouncilSizeMetric implements DaoContractMetricInterface {
  getType(): DaoStatsMetric {
    return DaoStatsMetric.CouncilSize;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const groups = await contract.getGroups();
    return groups.filter(isRoleGroupCouncil).length;
  }

  async getHistorical({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
