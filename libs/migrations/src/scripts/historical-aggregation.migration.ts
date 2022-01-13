import { ConfigService } from '@nestjs/config';
import { LazyModuleLoader } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Migration } from '..';
import { CacheService } from '@dao-stats/cache';
import { Aggregator, DaoStatsHistoryService } from '@dao-stats/common';

@Injectable()
export class HistoricalAggregationMigration implements Migration {
  private readonly logger = new Logger(HistoricalAggregationMigration.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly lazyModuleLoader: LazyModuleLoader,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  public async migrate(): Promise<void> {
    const { smartContracts } = this.configService.get('aggregator');

    for (const contractId of smartContracts) {
      this.logger.log(`Processing contract: ${contractId}...`);

      const { AggregationModule, AggregationService } = await import(
        '../../../../libs/' + contractId + '/'
      );
      const moduleRef = await this.lazyModuleLoader.load(
        () => AggregationModule,
      );

      const aggregationService = moduleRef.get(
        AggregationService,
      ) as Aggregator;

      for await (const metric of aggregationService.aggregateHistoricalMetrics(
        contractId,
      )) {
        await this.daoStatsHistoryService.createIgnore(metric);
      }

      this.logger.log(`Finished processing contract: ${contractId}`);
    }

    await this.cacheService.clearCache();
  }
}
