import { TransactionService } from '@dao-stats/transaction';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ContractContext, MetricQuery, nanosToMillis } from '@dao-stats/common';
import { RequestContext } from '@medibloc/nestjs-request-context';
import moment from 'moment';

// 5 years as a fallback for metrics 'from' query param
const FALLBACK_FROM_DATE = moment().subtract(5, 'years');

@Injectable()
export class MetricQueryPipe implements PipeTransform {
  constructor(private transactionService: TransactionService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(query: MetricQuery, metadata: ArgumentMetadata) {
    const { contractId }: ContractContext = RequestContext.get();

    let { from, to } = query;
    if (!from) {
      const tx = await this.transactionService.firstTransaction(contractId);

      from = Math.floor(
        tx ? nanosToMillis(tx?.blockTimestamp) : FALLBACK_FROM_DATE.valueOf(),
      );
    }

    if (!to) {
      to = moment().valueOf();
    }

    return { from, to };
  }
}
