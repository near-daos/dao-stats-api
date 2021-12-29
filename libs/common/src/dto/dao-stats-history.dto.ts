import { DaoStatsMetric } from '../types';

export interface DaoStatsHistoryDto {
  date: string;
  contractId: string;
  dao: string;
  metric: DaoStatsMetric;
  value: number;
}
