import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ContractContext,
  DaoContractContext,
  millisToNanos,
  nanosToMillis,
  picoToNear,
  Receipt,
  yoctoToPico,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { getGrowth } from '../utils';
import { ReceiptService } from 'libs/receipt/src';
import { ContractService } from '../contract/contract.service';

@Injectable()
export class FlowService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly receiptService: ReceiptService,
    private readonly contractService: ContractService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<FlowTotalResponse> {
    const { contract, dao } = context as DaoContractContext;
    const dayAgo = moment().subtract(1, 'days');

    let contractContext = context as DaoContractContext;
    if (!dao) {
      const { contractName: dao } = await this.contractService.findById(
        contract,
      );

      contractContext = {
        ...context,
        dao,
      };
    }

    const [txCount, dayAgoTxCount, incoming, outgoing] = await Promise.all([
      this.transactionService.getTransactionTotalCount(contractContext),
      this.transactionService.getTransactionTotalCount(contractContext, {
        from: null,
        to: millisToNanos(dayAgo.valueOf()),
      }),
      this.receiptService.findIncomingReceipts(contractContext),
      this.receiptService.findOutgoingReceipts(contractContext),
    ]);

    // TODO: move calculations to postgres query when migrated to 'json' type of ReceiptAction args

    const dayAgoIncoming = incoming.filter(
      ({ includedInBlockTimestamp }) =>
        nanosToMillis(includedInBlockTimestamp) <
        moment().subtract(1, 'days').valueOf(),
    );

    const dayAgoOutgoing = outgoing.filter(
      ({ includedInBlockTimestamp }) =>
        nanosToMillis(includedInBlockTimestamp) <
        moment().subtract(1, 'days').valueOf(),
    );

    const totalIn = this.calculateTotalNear(incoming);
    const totalOut = this.calculateTotalNear(outgoing);

    return {
      totalIn: {
        count: totalIn,
        growth: getGrowth(totalIn, this.calculateTotalNear(dayAgoIncoming)),
      },
      totalOut: {
        count: totalOut,
        growth: getGrowth(totalOut, this.calculateTotalNear(dayAgoOutgoing)),
      },
      transactions: {
        count: txCount,
        growth: getGrowth(txCount, dayAgoTxCount),
      },
    };
  }

  private calculateTotalNear(receipts: Receipt[]): number {
    return picoToNear(
      receipts
        .map(({ receiptActions }) => receiptActions)
        .flat()
        .reduce(
          (acc, action) =>
            acc + yoctoToPico(parseInt(action?.args?.deposit as string) || 0),
          0,
        ),
    );
  }
}
