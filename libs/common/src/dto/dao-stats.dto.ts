import { DaoStatsMetric } from '../types';

export interface DaoStatsDto {
  contractId: string;
  dao: string;
  metric: DaoStatsMetric;
  value: number;
}
