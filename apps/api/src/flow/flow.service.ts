import moment from 'moment';
import { Injectable } from '@nestjs/common';

import { DaoContractContext, MetricQuery } from '@dao-stats/common';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { getDailyIntervals, getGrowth } from '../utils';
import { ContractService } from '../contract/contract.service';
import { ReceiptActionService } from 'libs/receipt/src/receipt-action.service';
import { TransferType } from 'libs/receipt/src/types/transfer-type';
import { FlowMetricResponse } from './dto/flow-metric-response.dto';
import { FlowLeaderboardMetricResponse } from './dto/flow-leaderboard-metric-response.dto';
import { FlowMetricType } from 'libs/receipt/src/types/flow-metric-type';

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
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Transaction,
        TransferType.Incoming,
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Transaction,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Transaction,
        TransferType.Outgoing,
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Transaction,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Fund,
        TransferType.Incoming,
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Fund,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Fund,
        TransferType.Outgoing,
      ),
      this.receiptActionService.getTotals(
        context,
        FlowMetricType.Fund,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
    ]);

    return {
      totalIn: {
        count: totalIn.count || 0,
        growth: getGrowth(totalIn.count, dayAgoTotalIn.count),
      },
      totalOut: {
        count: totalOut.count || 0,
        growth: getGrowth(totalOut.count, dayAgoTotalOut.count),
      },
      transactionsIn: {
        count: txInCount.count,
        growth: getGrowth(txInCount.count, dayAgoTxInCount.count),
      },
      transactionsOut: {
        count: txOutCount.count,
        growth: getGrowth(txOutCount.count, dayAgoTxOutCount.count),
      },
    };
  }

  async history(
    context: DaoContractContext,
    metricType: FlowMetricType,
    metricQuery?: MetricQuery,
  ): Promise<FlowMetricResponse> {
    const [incoming, outgoing] = await Promise.all([
      this.receiptActionService.getHistory(
        context,
        metricType,
        TransferType.Incoming,
        metricQuery,
      ),
      this.receiptActionService.getHistory(
        context,
        metricType,
        TransferType.Incoming,
        metricQuery,
      ),
    ]);

    return {
      incoming: incoming.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
      outgoing: outgoing.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async leaderboard(
    context: DaoContractContext,
    metricType: FlowMetricType,
  ): Promise<FlowLeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());
    const dayAgo = moment().subtract(1, 'days');

    const [
      byDaysIncoming,
      byDaysOutgoing,
      dayAgoIncoming,
      incoming,
      dayAgoOutgoing,
      outgoing,
    ] = await Promise.all([
      this.receiptActionService.getLeaderboard(
        context,
        metricType,
        TransferType.Incoming,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.receiptActionService.getLeaderboard(
        context,
        metricType,
        TransferType.Outgoing,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.receiptActionService.getLeaderboard(
        context,
        metricType,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        context,
        metricType,
        TransferType.Incoming,
        {
          to: moment().valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        context,
        metricType,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        context,
        metricType,
        TransferType.Outgoing,
        {
          to: moment().valueOf(),
        },
      ),
    ]);

    return {
      incoming: incoming.map(({ receiver_account_id: dao, count }) => {
        const dayAgoCount =
          dayAgoIncoming.find(
            ({ receiver_account_id }) => receiver_account_id === dao,
          )?.count || 0;

        return {
          dao,
          activity: {
            count,
            growth: getGrowth(count, dayAgoCount),
          },
          overview: days.map(({ end: timestamp }) => ({
            timestamp,
            count:
              byDaysIncoming.find(
                ({ receiver_account_id, day }) =>
                  receiver_account_id === dao &&
                  moment(day).isSame(moment(timestamp), 'day'),
              )?.count || 0,
          })),
        };
      }),
      outgoing: outgoing.map(({ receiver_account_id: dao, count }) => {
        const dayAgoCount =
          dayAgoOutgoing.find(
            ({ receiver_account_id }) => receiver_account_id === dao,
          )?.count || 0;

        return {
          dao,
          activity: {
            count,
            growth: getGrowth(count, dayAgoCount),
          },
          overview: days.map(({ end: timestamp }) => ({
            timestamp,
            count:
              byDaysOutgoing.find(
                ({ receiver_account_id, day }) =>
                  receiver_account_id === dao &&
                  moment(day).isSame(moment(timestamp), 'day'),
              )?.count || 0,
          })),
        };
      }),
    };
  }
}
