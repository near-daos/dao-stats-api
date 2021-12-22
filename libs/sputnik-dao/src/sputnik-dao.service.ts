import { Injectable, Logger } from '@nestjs/common';
import { Aggregator, DaoStatsDto, TransactionDto } from '@dao-stats/common';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  aggregateMetrics(): AsyncGenerator<DaoStatsDto[]> {
    return undefined;
  }

  aggregateTransactions(): AsyncGenerator<TransactionDto[]> {
    return undefined;
  }
}
