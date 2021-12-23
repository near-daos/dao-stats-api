import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import {
  DaoFactoryContractMetricCurrentParams,
  DaoFactoryContractMetricHistoryParams,
  DaoFactoryContractMetricHistoryResponse,
  DaoFactoryContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class DaoCountMetric implements DaoFactoryContractMetricInterface {
  getType(): DaoStatsMetric {
    return DaoStatsMetric.DaoCount;
  }

  async getCurrentValue({
    contract,
  }: DaoFactoryContractMetricCurrentParams): Promise<number> {
    return (await contract.getDaoList()).length;
  }

  async getHistoricalValues({}: DaoFactoryContractMetricHistoryParams): Promise<DaoFactoryContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
