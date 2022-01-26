import { ApiMetric } from '../types/api-metric';

export interface ApiMetricService<T extends ApiMetric> {
  getType(): T;
}
