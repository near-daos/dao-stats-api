import { DaoStatsMetric } from '@dao-stats/common';
import { DaoContract, DaoFactoryContract } from '../contracts';

export interface DaoContractMetricCurrentParams {
  contract: DaoContract;
  factoryContract: DaoFactoryContract;
}

export interface DaoContractMetricHistoryParams
  extends DaoContractMetricCurrentParams {
  from?: number;
  to?: number;
}

export interface DaoContractMetricDaily {
  date: Date;
  total: number;
  change: number;
}

export type DaoContractMetricHistoryResponse = DaoContractMetricDaily[];

export interface DaoContractMetricInterface {
  getType(): DaoStatsMetric;
  getTotal(args: DaoContractMetricCurrentParams): Promise<number>;
  getHistorical(
    args: DaoContractMetricHistoryParams,
  ): Promise<DaoContractMetricHistoryResponse>;
}
