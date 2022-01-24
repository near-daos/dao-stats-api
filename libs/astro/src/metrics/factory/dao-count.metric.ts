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
    factoryContract,
  }: DaoFactoryContractMetricCurrentParams): Promise<number> {
    return (await factoryContract.getDaoList()).length;
  }

  async getHistorical({
    factoryContract,
  }: DaoFactoryContractMetricHistoryParams): Promise<DaoFactoryContractMetricHistoryResponse> {
    return this.nearIndexerService.getDaoCountDaily(factoryContract.contractId);
  }
}
