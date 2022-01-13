import { DaoStatsMetric } from '../types';

export interface DaoStatsHistoryDto {
  date: string;
  contractId: string;
  metric: DaoStatsMetric;
  dao: string;
  total: number;
}
