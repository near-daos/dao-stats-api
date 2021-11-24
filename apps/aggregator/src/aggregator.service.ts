import { Aggregator } from '@dao-stats/common/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lazyModuleLoader: LazyModuleLoader,
  ) {
    const { pollingInterval } = this.configService.get('aggregator');

    const interval = setInterval(
      () => this.scheduleAggregation(),
      pollingInterval,
    );
    schedulerRegistry.addInterval('polling', interval);
  }

  public async scheduleAggregation(): Promise<void> {
    const { smartContracts } = this.configService.get('aggregator');

    for (const contract of smartContracts) {
      const { AggregationModule, AggregationService } = await import(
        '../../../libs/' + contract + '/'
      );
      const moduleRef = await this.lazyModuleLoader.load(
        () => AggregationModule,
      );

      const aggregationService = moduleRef.get(
        AggregationService,
      ) as Aggregator;

      await aggregationService.aggregate();
    }
  }
}
