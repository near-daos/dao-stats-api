import { Injectable } from '@nestjs/common';
import { isRoleGroup } from '@dao-stats/astro';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';
import { CreateArgs, Role, RoleKindGroup } from '../../types';

@Injectable()
export class MembersCountMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.MembersCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const groups = await contract.getGroups();
    const members = [
      ...new Set(
        groups.map((group: Role<RoleKindGroup>) => group.kind.Group).flat(),
      ),
    ];
    return members.length;
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
        let membersCount;
        if (Array.isArray(policy)) {
          membersCount = policy.length;
        } else {
          membersCount = policy.roles
            .filter(isRoleGroup)
            .map((group: Role<RoleKindGroup>) => group.kind.Group)
            .flat().length;
        }
        return {
          date,
          total: membersCount,
        };
      })
      .filter((data) => data);
  }
}
