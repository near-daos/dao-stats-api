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
    return undefined;
  }

  aggregateDaos(): AsyncGenerator<DaoDto> {
    return undefined;
  }

  aggregateMetrics(): AsyncGenerator<DaoStatsDto> {
    return undefined;
  }

  aggregateHistoricalMetrics(): AsyncGenerator<DaoStatsHistoryDto> {
    return undefined;
  }
}
