import moment from 'moment';
import { Injectable } from '@nestjs/common';
import {
  DaoContractContext,
  LeaderboardMetric,
  MetricQuery,
} from '@dao-stats/common';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { ContractService } from '../contract/contract.service';
import { ReceiptActionService } from 'libs/receipt/src/receipt-action.service';
import { TransferType } from 'libs/receipt/src/types/transfer-type';
import { FlowMetricResponse } from './dto/flow-metric-response.dto';
import { FlowLeaderboardMetricResponse } from './dto/flow-leaderboard-metric-response.dto';
import { FlowMetricType } from 'libs/receipt/src/types/flow-metric-type';
import { getDailyIntervals, getGrowth, yoctoToNear } from '../utils';

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
        count: yoctoToNear(totalIn.count || 0).toNumber(),
        growth: getGrowth(totalIn.count, dayAgoTotalIn.count),
      },
      totalOut: {
        count: yoctoToNear(totalOut.count || 0).toNumber(),
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
        TransferType.Outgoing,
        metricQuery,
      ),
    ]);

    const days = [
      ...new Set([
        ...incoming.map(({ day }) => moment(day).valueOf()),
        ...outgoing.map(({ day }) => moment(day).valueOf()),
      ]),
    ].sort((a, b) => a.valueOf() - b.valueOf());

    return {
      metrics: days.map((day) => {
        const inc =
          incoming.find((metric) => day === moment(metric.day).valueOf())
            ?.count || 0;
        const out =
          outgoing.find((metric) => day === moment(metric.day).valueOf())
            ?.count || 0;

        return {
          timestamp: day,
          incoming:
            metricType == FlowMetricType.Fund
              ? yoctoToNear(inc).toNumber()
              : inc,
          outgoing:
            metricType === FlowMetricType.Fund
              ? yoctoToNear(out).toNumber()
              : out,
        };
      }),
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
      incoming: this.getLeaderboardMetrics(
        metricType,
        incoming,
        dayAgoIncoming,
        byDaysIncoming,
        days,
      ),
      outgoing: this.getLeaderboardMetrics(
        metricType,
        outgoing,
        dayAgoOutgoing,
        byDaysOutgoing,
        days,
      ),
    };
  }

  // TODO: re-visit leaderboard metric types
  private getLeaderboardMetrics(
    metricType: FlowMetricType,
    data,
    dayAgoData,
    byDaysData,
    days: { start: number; end: number }[],
  ): LeaderboardMetric[] {
    return data.map(({ receiver_account_id: dao, count }) => {
      const dayAgoCount =
        dayAgoData.find(
          ({ receiver_account_id }) => receiver_account_id === dao,
        )?.count || 0;

      return {
        dao,
        activity: {
          count:
            metricType === FlowMetricType.Fund
              ? yoctoToNear(count).toNumber()
              : count,
          growth: getGrowth(count, dayAgoCount),
        },
        overview: days.map(({ end: timestamp }) => {
          const count =
            byDaysData.find(
              ({ receiver_account_id, day }) =>
                receiver_account_id === dao &&
                moment(day).isSame(moment(timestamp), 'day'),
            )?.count || 0;

          return {
            timestamp,
            count:
              metricType === FlowMetricType.Fund
                ? yoctoToNear(count).toNumber()
                : count,
          };
        }),
      };
    });
  }
}
