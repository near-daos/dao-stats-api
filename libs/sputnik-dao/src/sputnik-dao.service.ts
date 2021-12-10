import { Injectable, Logger } from '@nestjs/common';
import { Aggregator, DaoStatsDto, TransactionDto } from '@dao-stats/common';

@Injectable()
export class AggregationService implements Aggregator {
  private readonly logger = new Logger(AggregationService.name);

  aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto[]> {
    return undefined;
  }

  aggregateTransactions(
    from?: number,
    to?: number,
  ): AsyncGenerator<TransactionDto[]> {
    return undefined;
  }
}
