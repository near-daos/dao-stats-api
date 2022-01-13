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

export interface DaoFactoryContractMetricDaily {
  date: Date;
  total: number;
  change: number;
}

export type DaoFactoryContractMetricHistoryResponse =
  DaoFactoryContractMetricDaily[];

export interface DaoFactoryContractMetricInterface {
  getType(): DaoStatsMetric;
  getTotal(args: DaoFactoryContractMetricCurrentParams): Promise<number>;
  getHistorical(
    args: DaoFactoryContractMetricHistoryParams,
  ): Promise<DaoFactoryContractMetricHistoryResponse>;
}
