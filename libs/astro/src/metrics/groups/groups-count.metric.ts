import { Injectable } from '@nestjs/common';
import { CreateArgs, isRoleGroup } from '@dao-stats/astro';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class GroupsCountMetric implements DaoContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.GroupsCount;
  }

  async getTotal({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (await contract.getGroups()).length;
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
        let groupsCount;
        if (Array.isArray(policy)) {
          groupsCount = 1;
        } else {
          groupsCount = policy.roles.filter(isRoleGroup).length;
        }
        return {
          date,
          total: groupsCount,
        };
      })
      .filter((data) => data);
  }
}
