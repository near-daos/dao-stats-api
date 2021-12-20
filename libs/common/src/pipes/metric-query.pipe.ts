import { TransactionService } from '@dao-stats/transaction';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { nanosToMillis } from '@dao-stats/common';
import { MetricQuery } from '../dto';

@Injectable()
export class MetricQueryPipe implements PipeTransform {
  constructor(private transactionService: TransactionService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(query: MetricQuery, metadata: ArgumentMetadata) {
    const { to } = query;
    let { from } = query;
    if (!from) {
      const tx = await this.transactionService.firstTransaction('astro');

      from = Math.floor(nanosToMillis(tx?.blockTimestamp));
    }

    return { from, to };
  }
}
