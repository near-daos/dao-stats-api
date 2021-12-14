import moment from 'moment';
import { Injectable } from '@nestjs/common';

import {
  DailyCountDto,
  DaoContractContext,
  MetricQuery,
} from '@dao-stats/common';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { getGrowth } from '../utils';
import { ContractService } from '../contract/contract.service';
import { ReceiptActionService } from 'libs/receipt/src/receipt-action.service';
import { TransferType } from 'libs/receipt/src/types/transfer-type';
import { FlowMetricResponse } from './dto/flow-metric-response.dto';

@Injectable()
export class FlowService {
  constructor(
    private readonly receiptActionService: ReceiptActionService,
    private readonly contractService: ContractService,
  ) {}

  async totals(context: DaoContractContext): Promise<FlowTotalResponse> {
    const dayAgo = moment().subtract(1, 'days');

    const [
      txInCount,
      dayAgoTxInCount,
      txOutCount,
      dayAgoTxOutCount,
      totalIn,
      dayAgoTotalIn,
      totalOut,
      dayAgoTotalOut,
    ] = await Promise.all([
      this.receiptActionService.getTransfers(context, TransferType.Incoming),
      this.receiptActionService.getTransfers(context, TransferType.Incoming, {
        to: dayAgo.valueOf(),
      }),
      this.receiptActionService.getTransfers(context, TransferType.Outgoing),
      this.receiptActionService.getTransfers(context, TransferType.Outgoing, {
        to: dayAgo.valueOf(),
      }),
      this.receiptActionService.getFunds(context, TransferType.Incoming),
      this.receiptActionService.getFunds(context, TransferType.Incoming, {
        to: dayAgo.valueOf(),
      }),
      this.receiptActionService.getFunds(context, TransferType.Outgoing),
      this.receiptActionService.getFunds(context, TransferType.Outgoing, {
        to: dayAgo.valueOf(),
      }),
    ]);

    return {
      totalIn: {
        count: totalIn.count,
        growth: getGrowth(totalIn.count, dayAgoTotalIn.count),
      },
      totalOut: {
        count: totalOut.count,
        growth: getGrowth(totalOut.count, dayAgoTotalOut.count),
      },
      transactionsIn: {
        count: txInCount,
        growth: getGrowth(txInCount, dayAgoTxInCount),
      },
      transactionsOut: {
        count: txOutCount,
        growth: getGrowth(txOutCount, dayAgoTxOutCount),
      },
    };
  }

  async funds(
    context: DaoContractContext,
    metricQuery?: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.history(
      await this.receiptActionService.getFundsHistory(
        context,
        TransferType.Incoming,
        metricQuery,
      ),
      await this.receiptActionService.getFundsHistory(
        context,
        TransferType.Incoming,
        metricQuery,
      ),
    );
  }

  async transactions(
    context: DaoContractContext,
    metricQuery?: MetricQuery,
  ): Promise<FlowMetricResponse> {
    return this.history(
      await this.receiptActionService.getTransfersHistory(
        context,
        TransferType.Incoming,
        metricQuery,
      ),
      await this.receiptActionService.getTransfersHistory(
        context,
        TransferType.Incoming,
        metricQuery,
      ),
    );
  }

  private history(
    incoming: DailyCountDto[],
    outgoing: DailyCountDto[],
  ): FlowMetricResponse {
    return {
      in: incoming.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
      out: outgoing.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }
}
