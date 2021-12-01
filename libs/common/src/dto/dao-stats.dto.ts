import { DAOStatsMetric } from '../types';

export interface DAOStatsDto {
  contractId: string;
  dao: string;
  metric: DAOStatsMetric;
  value: number;
}
