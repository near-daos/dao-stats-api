import { ModuleRef } from '@nestjs/core';
import {
  ArgumentMetadata,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';

import { ApiMetricService } from '../common/interfaces/api-metric.interface';
import { ApiMetric } from '../common/types/api-metric';

@Injectable()
export abstract class ApiMetricPipe implements PipeTransform {
  constructor(private readonly moduleRef: ModuleRef) {}

  abstract getServices(): any[];

  async transform(metric: ApiMetric, metadata: ArgumentMetadata) {
    let service: ApiMetricService<ApiMetric>;
    for (const serviceClass of this.getServices()) {
      const instance = this.moduleRef.get(serviceClass);

      if (instance.getType() === metric) {
        service = instance;

        break;
      }
    }

    if (!service) {
      throw new NotFoundException('Metric not found!');
    }

    return service;
  }
}
