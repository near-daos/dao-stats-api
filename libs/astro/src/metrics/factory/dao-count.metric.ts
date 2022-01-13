import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import {
  DaoFactoryContractMetricCurrentParams,
  DaoFactoryContractMetricHistoryParams,
  DaoFactoryContractMetricHistoryResponse,
  DaoFactoryContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class DaoCountMetric implements DaoFactoryContractMetricInterface {
  constructor(private readonly nearIndexerService: NearIndexerService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.DaoCount;
  }

  async getTotal({
    contract,
  }: DaoFactoryContractMetricCurrentParams): Promise<number> {
    return (await contract.getDaoList()).length;
  }

  async getHistorical({
    contract,
  }: DaoFactoryContractMetricHistoryParams): Promise<DaoFactoryContractMetricHistoryResponse> {
    return this.nearIndexerService.getDaoCountDaily(contract.contractId);
  }
}
