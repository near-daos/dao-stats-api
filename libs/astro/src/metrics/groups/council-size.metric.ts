import { Injectable } from '@nestjs/common';
import { Role, RoleKindGroup } from '@dao-stats/astro';
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

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const groups = await contract.getGroups();
    const [council] = groups.filter(isRoleGroupCouncil);
    return council ? (council as Role<RoleKindGroup>).kind.Group.length : 0;
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
