import { ActivityApiMetric } from '../../activity/types/activity-api-metric';
import { TotalApiMetric } from '../../totals/types/total-metric-type';

export type ApiMetric = TotalApiMetric | ActivityApiMetric;
