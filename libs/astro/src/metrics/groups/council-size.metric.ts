import { Injectable } from '@nestjs/common';
import { CreateArgs, Role, RoleKindGroup } from '@dao-stats/astro';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { isRoleGroupCouncil } from '../../utils';

@Injectable()
export class CouncilSizeMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.CouncilSize;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const groups = await contract.getGroups();
    return groups.filter(isRoleGroupCouncil).length;
  }

  async getHistorical({
    factoryContract,
    contract,
  }: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    const createArgsDaily = await this.nearIndexerService.getCreateArgsDaily(
      factoryContract.contractId,
      contract.contractId,
    );
    return createArgsDaily
      .map(({ date, args }) => {
        const policy = (args.args_json as CreateArgs)?.policy;
        if (!policy) {
          return null;
        }
        let councilSize;
        if (Array.isArray(policy)) {
          councilSize = policy.length;
        } else {
          const [council] = policy.roles.filter(isRoleGroupCouncil);
          councilSize = council
            ? (council as Role<RoleKindGroup>).kind.Group.length
            : 0;
        }
        return {
          date,
          total: councilSize,
        };
      })
      .filter((data) => data);
  }
}
