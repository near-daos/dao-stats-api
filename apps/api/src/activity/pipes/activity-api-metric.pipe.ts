import { Injectable } from '@nestjs/common';

import services from '../metrics';
import { ApiMetricPipe } from '../../pipes/api-metric.pipe';

@Injectable()
export class ActivityApiMetricPipe extends ApiMetricPipe {
  getServices() {
    return services;
  }
}
