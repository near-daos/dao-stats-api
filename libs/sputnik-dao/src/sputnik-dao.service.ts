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
  aggregateDaos(contractId: string): AsyncGenerator<DaoDto, any, unknown> {
    throw new Error('Method not implemented.');
  }

  aggregateHistoricalMetrics(
    contractId: string,
  ): AsyncGenerator<DaoStatsHistoryDto, any, unknown> {
    throw new Error('Method not implemented.');
  }

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
