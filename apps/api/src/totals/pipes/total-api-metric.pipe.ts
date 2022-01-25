import { Injectable } from '@nestjs/common';

import services from '../metrics';
import { ApiMetricPipe } from '../../pipes/api-metric.pipe';

@Injectable()
export class TotalApiMetricPipe extends ApiMetricPipe {
  getServices() {
    return services;
  }
}
