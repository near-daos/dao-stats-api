import { Injectable } from '@nestjs/common';
import {
  Aggregator,
  DaoDto,
  DaoStatsDto,
  DaoStatsHistoryDto,
  ReceiptActionDto,
} from '@dao-stats/common';

@Injectable()
export class AggregationService implements Aggregator {
  aggregateReceiptActions(): AsyncGenerator<ReceiptActionDto[]> {
    throw new Error('Method not implemented.');
  }

  aggregateDaos(): AsyncGenerator<DaoDto> {
    throw new Error('Method not implemented.');
  }

  aggregateMetrics(): AsyncGenerator<DaoStatsDto> {
    throw new Error('Method not implemented.');
  }

  aggregateHistoricalMetrics(): AsyncGenerator<DaoStatsHistoryDto> {
    throw new Error('Method not implemented.');
  }
}
