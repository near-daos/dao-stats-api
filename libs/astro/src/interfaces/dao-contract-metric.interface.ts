import { DaoStatsMetric } from '@dao-stats/common';
import { DaoContract } from '../contracts';

export interface DaoContractMetricCurrentParams {
  contract: DaoContract;
}

export interface DaoContractMetricHistoryParams
  extends DaoContractMetricCurrentParams {
  from?: number;
  to?: number;
}

export type DaoContractMetricHistoryResponse = Record<number, number>;

export interface DaoContractMetricInterface {
  getType(): DaoStatsMetric;
  getCurrentValue(args: DaoContractMetricCurrentParams): Promise<number>;
  getHistoricalValues(
    args: DaoContractMetricHistoryParams,
  ): Promise<DaoContractMetricHistoryResponse>;
}
