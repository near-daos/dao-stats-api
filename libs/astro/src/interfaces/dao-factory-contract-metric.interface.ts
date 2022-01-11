import { DaoStatsMetric } from '@dao-stats/common';
import { DaoFactoryContract } from '../contracts';

export interface DaoFactoryContractMetricCurrentParams {
  contract: DaoFactoryContract;
}

export interface DaoFactoryContractMetricHistoryParams
  extends DaoFactoryContractMetricCurrentParams {
  from?: number;
  to?: number;
}

export type DaoFactoryContractMetricHistoryResponse = {
  date: Date;
  value: number;
};

export interface DaoFactoryContractMetricInterface {
  getType(): DaoStatsMetric;
  getCurrentValue(args: DaoFactoryContractMetricCurrentParams): Promise<number>;
  getHistoricalValues(
    args: DaoFactoryContractMetricHistoryParams,
  ): Promise<DaoFactoryContractMetricHistoryResponse[]>;
}
