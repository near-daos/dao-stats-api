import { TransactionService } from '@dao-stats/transaction';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { nanosToMillis } from 'libs/common/utils';
import { MetricQuery } from '../dto/metric-query.dto';

@Injectable()
export class MetricQueryPipe implements PipeTransform {
  constructor(private transactionService: TransactionService) {}

  async transform(query: MetricQuery, metadata: ArgumentMetadata) {
    let { from, to } = query;
    if (!from) {
      const tx = await this.transactionService.getFirstTransaction('astro');

      from = Math.floor(nanosToMillis(tx?.blockTimestamp));
    }

    return { from, to };
  }
}
