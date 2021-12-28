import { DaoStatsMetric } from './dao-stats-metric';

export const DaoStatsMetricGroup = {
  BountiesAndGrantsValueLocked: [DaoStatsMetric.BountiesValueLocked],
  TotalValueLocked: [
    DaoStatsMetric.BountiesValueLocked,
    DaoStatsMetric.FtsValueLocked,
  ],
};
