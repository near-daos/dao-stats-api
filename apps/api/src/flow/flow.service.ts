import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { Contract, LeaderboardMetric, MetricQuery } from '@dao-stats/common';
import { FlowTotalResponse } from './dto/flow-total.dto';
import { ReceiptActionService } from 'libs/receipt/src/receipt-action.service';
import { TransferType } from 'libs/receipt/src/types/transfer-type';
import { FlowMetricResponse } from './dto/flow-metric-response.dto';
import { FlowLeaderboardMetricResponse } from './dto/flow-leaderboard-metric-response.dto';
import { FlowMetricType } from 'libs/receipt/src/types/flow-metric-type';
import { convertFunds, getDailyIntervals, getGrowth } from '../utils';
import { ContractContextService } from '../context/contract-context.service';

@Injectable()
export class FlowService extends ContractContextService {
  constructor(private readonly receiptActionService: ReceiptActionService) {
    super();
  }

  async totals(): Promise<FlowTotalResponse> {
    const { contract } = this.getContext();
    const { conversionFactor } = contract;

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
        FlowMetricType.Transaction,
        TransferType.Incoming,
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Transaction,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Transaction,
        TransferType.Outgoing,
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Transaction,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Fund,
        TransferType.Incoming,
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Fund,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Fund,
        TransferType.Outgoing,
      ),
      this.receiptActionService.getTotals(
        FlowMetricType.Fund,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
    ]);

    return {
      totalIn: {
        count: convertFunds(totalIn.count || 0, conversionFactor).toNumber(),
        growth: getGrowth(totalIn.count, dayAgoTotalIn.count),
      },
      totalOut: {
        count: convertFunds(totalOut.count || 0, conversionFactor).toNumber(),
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
    metricType: FlowMetricType,
    metricQuery?: MetricQuery,
  ): Promise<FlowMetricResponse> {
    const { contract } = this.getContext();
    const { conversionFactor } = contract;

    const [incoming, outgoing] = await Promise.all([
      this.receiptActionService.getHistory(
        metricType,
        TransferType.Incoming,
        metricQuery,
      ),
      this.receiptActionService.getHistory(
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
              ? convertFunds(inc, conversionFactor).toNumber()
              : inc,
          outgoing:
            metricType === FlowMetricType.Fund
              ? convertFunds(out, conversionFactor).toNumber()
              : out,
        };
      }),
    };
  }

  async leaderboard(
    metricType: FlowMetricType,
  ): Promise<FlowLeaderboardMetricResponse> {
    const { contract } = this.getContext();

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
        metricType,
        TransferType.Incoming,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.receiptActionService.getLeaderboard(
        metricType,
        TransferType.Outgoing,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.receiptActionService.getLeaderboard(
        metricType,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        metricType,
        TransferType.Incoming,
        {
          to: moment().valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        metricType,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
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
        contract,
      ),
      outgoing: this.getLeaderboardMetrics(
        metricType,
        outgoing,
        dayAgoOutgoing,
        byDaysOutgoing,
        days,
        contract,
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
    contract: Contract,
  ): LeaderboardMetric[] {
    const { conversionFactor } = contract;

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
              ? convertFunds(count, conversionFactor).toNumber()
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
                ? convertFunds(count, conversionFactor).toNumber()
                : count,
          };
        }),
      };
    });
  }
}
