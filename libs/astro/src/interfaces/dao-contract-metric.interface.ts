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
