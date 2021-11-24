import { Aggregator } from '@dao-stats/common/interfaces';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  constructor() {}

  public async aggregate(): Promise<void> {
    this.logger.log('Aggregating Sputnik DAO...');
  }
}
