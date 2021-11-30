import { AggregationOutput, Aggregator } from '@dao-stats/common/interfaces';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  public async aggregate(): Promise<AggregationOutput> {
    this.logger.log('Aggregating Sputnik DAO...');

    return new AggregationOutput();
  }
}
