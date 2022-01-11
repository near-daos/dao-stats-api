import { TransactionService } from '@dao-stats/transaction';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ContractContext, nanosToMillis } from '@dao-stats/common';
import { RequestContext } from '@medibloc/nestjs-request-context';
import moment from 'moment';

// 2 years as a fallback for metrics 'from' query param
const FALLBACK_FROM_DATE = moment().subtract(2, 'years');

@Injectable()
export class MetricQueryPipe implements PipeTransform {
  constructor(private transactionService: TransactionService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(query: any, metadata: ArgumentMetadata) {
    const { contractId }: ContractContext = RequestContext.get();

    let { from, to } = query;

    if (from) {
      from = moment(isNaN(from) ? from : parseInt(from));

      if (!from.isValid()) {
        throw new BadRequestException(`Invalid 'from' query parameter.`);
      }
    }

    if (!from) {
      const tx = await this.transactionService.firstTransaction(contractId);

      from = tx
        ? moment(nanosToMillis(tx?.blockTimestamp))
        : FALLBACK_FROM_DATE;
    }

    to = moment(to);
    if (!to.isValid()) {
      throw new BadRequestException(`Invalid 'to' query parameter.`);
    }

    return {
      from: from.valueOf(),
      to: to.valueOf(),
    };
  }
}
