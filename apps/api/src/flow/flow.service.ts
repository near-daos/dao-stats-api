import moment from 'moment';
import { Injectable } from '@nestjs/common';
import {
  Contract,
  ContractContext,
  DaoContractContext,
  LeaderboardMetric,
  MetricQuery,
} from '@dao-stats/common';
import {
  FlowMetricType,
  ReceiptActionService,
  TransferType,
} from '@dao-stats/receipt';
import {
  FlowTotalResponse,
  FlowMetricResponse,
  FlowLeaderboardMetricResponse,
} from './dto';
import { convertFunds, getDailyIntervals, getGrowth } from '../utils';
import { ContractService } from '../contract/contract.service';

@Injectable()
export class FlowService {
  constructor(
    private readonly receiptActionService: ReceiptActionService,
    private readonly contractService: ContractService,
  ) {}

  async totals(context: ContractContext): Promise<FlowTotalResponse> {
    const dayAgo = moment().subtract(1, 'days');

    const contract = await this.contractService.findById(context.contractId);

    const { conversionFactor } = contract;

    const contractContext = {
      ...context,
      contract,
    };

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
        contractContext,
        FlowMetricType.Transaction,
        TransferType.Incoming,
      ),
      this.receiptActionService.getTotals(
        contractContext,
        FlowMetricType.Transaction,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        contractContext,
        FlowMetricType.Transaction,
        TransferType.Outgoing,
      ),
      this.receiptActionService.getTotals(
        contractContext,
        FlowMetricType.Transaction,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        contractContext,
        FlowMetricType.Fund,
        TransferType.Incoming,
      ),
      this.receiptActionService.getTotals(
        contractContext,
        FlowMetricType.Fund,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getTotals(
        contractContext,
        FlowMetricType.Fund,
        TransferType.Outgoing,
      ),
      this.receiptActionService.getTotals(
        contractContext,
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
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
    metricQuery?: MetricQuery,
  ): Promise<FlowMetricResponse> {
    const contract = await this.contractService.findById(context.contractId);

    const { conversionFactor } = contract;

    const contractContext = {
      ...context,
      contract,
    };

    const [incoming, outgoing] = await Promise.all([
      this.receiptActionService.getHistory(
        contractContext,
        metricType,
        TransferType.Incoming,
        metricQuery,
      ),
      this.receiptActionService.getHistory(
        contractContext,
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
          timestamp: moment(day).endOf('day').valueOf(),
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
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
  ): Promise<FlowLeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());
    const dayAgo = moment().subtract(1, 'days');

    const contract = await this.contractService.findById(context.contractId);

    const contractContext = {
      ...context,
      contract,
    };

    const [
      byDaysIncoming,
      byDaysOutgoing,
      dayAgoIncoming,
      incoming,
      dayAgoOutgoing,
      outgoing,
    ] = await Promise.all([
      this.receiptActionService.getLeaderboard(
        contractContext,
        metricType,
        TransferType.Incoming,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.receiptActionService.getLeaderboard(
        contractContext,
        metricType,
        TransferType.Outgoing,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.receiptActionService.getLeaderboard(
        contractContext,
        metricType,
        TransferType.Incoming,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        contractContext,
        metricType,
        TransferType.Incoming,
        {
          to: moment().valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        contractContext,
        metricType,
        TransferType.Outgoing,
        {
          to: dayAgo.valueOf(),
        },
      ),
      this.receiptActionService.getLeaderboard(
        contractContext,
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

    return data.map(({ account_id: dao, count }) => {
      const dayAgoCount =
        dayAgoData.find(({ account_id }) => account_id === dao)?.count || 0;

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
              ({ account_id, day }) =>
                account_id === dao &&
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
