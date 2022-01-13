import { DaoStatsMetric } from '../types';

export interface DaoStatsDto {
  contractId: string;
  metric: DaoStatsMetric;
  dao: string;
  total: number;
}
