import { Injectable } from '@nestjs/common';
import {
  Aggregator,
  DaoDto,
  DaoStatsDto,
  ReceiptActionDto,
} from '@dao-stats/common';

@Injectable()
export class AggregationService implements Aggregator {
  aggregateMetrics(): AsyncGenerator<DaoStatsDto> {
    return undefined;
  }

  async getDaos(): Promise<DaoDto[]> {
    return [];
  }

  aggregateReceiptActions(): AsyncGenerator<ReceiptActionDto[]> {
    return undefined;
  }
}
