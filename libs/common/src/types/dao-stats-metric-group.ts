import { DaoStatsMetric } from './dao-stats-metric';

export const DaoStatsMetricGroup = {
  ActionsCount: [DaoStatsMetric.ActionsInCount, DaoStatsMetric.ActionsOutCount],
  ActionsActionsFunctionCallCount: [
    DaoStatsMetric.ActionsFunctionCallInCount,
    DaoStatsMetric.ActionsFunctionCallOutCount,
  ],
  BountiesAndGrantsValueLocked: [DaoStatsMetric.BountiesValueLocked],
  DaoActionsDepositInCount: [
    DaoStatsMetric.ActionsDepositInternalInCount,
    DaoStatsMetric.ActionsDepositExternalInCount,
  ],
  DaoActionsDepositOutCount: [
    DaoStatsMetric.ActionsDepositInternalOutCount,
    DaoStatsMetric.ActionsDepositExternalOutCount,
  ],
  DaoActionsDepositInValue: [
    DaoStatsMetric.ActionsDepositInternalInValue,
    DaoStatsMetric.ActionsDepositExternalInValue,
  ],
  DaoActionsDepositOutValue: [
    DaoStatsMetric.ActionsDepositInternalOutValue,
    DaoStatsMetric.ActionsDepositExternalOutValue,
  ],
  PlatformActionsDepositInCount: [DaoStatsMetric.ActionsDepositExternalInCount],
  PlatformActionsDepositOutCount: [
    DaoStatsMetric.ActionsDepositExternalOutCount,
  ],
  PlatformActionsDepositInValue: [DaoStatsMetric.ActionsDepositExternalInValue],
  PlatformActionsDepositOutValue: [
    DaoStatsMetric.ActionsDepositExternalOutValue,
  ],
  TotalValueLocked: [
    DaoStatsMetric.AccountBalance,
    DaoStatsMetric.FtsValueLocked,
  ],
};
