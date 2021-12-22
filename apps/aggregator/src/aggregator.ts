import LRUCache from 'lru-cache';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, LogLevel } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import cacheManager from '@type-cacheable/core';
import { useAdapter } from '@type-cacheable/lru-cache-adapter';

import { AggregatorModule } from './aggregator.module';
import { AggregatorService } from './aggregator.service';

export default class Aggregator {
  private readonly logger = new Logger(Aggregator.name);

  async bootstrap(): Promise<void> {
    const cache = new LRUCache();
    useAdapter(cache);
    cacheManager.setOptions({
      excludeContext: false,
    });

    const logger = [...(process.env.LOG_LEVELS.split(',') as LogLevel[])];
    const app = await NestFactory.createMicroservice(AggregatorModule, {
      transport: Transport.TCP,
      logger,
    });

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    await app.listen();

    this.logger.log('Aggregator Microservice is listening...');

    // TODO: handle the very 1st aggregation
    // Run initial aggregation
    await app.get(AggregatorService).scheduleAggregation();
  }
}
