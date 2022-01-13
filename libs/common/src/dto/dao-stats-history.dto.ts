import { DaoStatsMetric } from '../types';

export interface DaoStatsHistoryDto {
  date?: Date;
  contractId: string;
  metric: DaoStatsMetric;
  dao: string;
  total: number;
  change?: number;
}
