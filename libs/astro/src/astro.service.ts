import { AggregationOutput, Aggregator } from '@dao-stats/common/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private readonly configService: ConfigService) {}

  public async aggregate(): Promise<AggregationOutput> {
    this.logger.log('Aggregating Astro DAO...');

    return new AggregationOutput();
  }
}
