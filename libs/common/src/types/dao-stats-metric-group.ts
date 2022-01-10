import { DaoStatsMetric } from './dao-stats-metric';

export const DaoStatsMetricGroup = {
  ActionsCount: [DaoStatsMetric.ActionsInCount, DaoStatsMetric.ActionsOutCount],
  ActionsActionsFunctionCallCount: [
    DaoStatsMetric.ActionsFunctionCallInCount,
    DaoStatsMetric.ActionsFunctionCallOutCount,
  ],
  ActionsDepositCount: [
    DaoStatsMetric.ActionsDepositInCount,
    DaoStatsMetric.ActionsDepositOutCount,
  ],
  ActionsDepositValue: [
    DaoStatsMetric.ActionsDepositInValue,
    DaoStatsMetric.ActionsDepositOutValue,
  ],
  BountiesAndGrantsValueLocked: [DaoStatsMetric.BountiesValueLocked],
  TotalValueLocked: [
    DaoStatsMetric.AccountBalance,
    DaoStatsMetric.FtsValueLocked,
  ],
};
