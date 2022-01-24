import moment from 'moment';
import Decimal from 'decimal.js';
import { Metric, MetricQuery, MetricType } from '@dao-stats/common';

export const getGrowth = (
  current: number,
  prev: number,
  decimals: number = 2,
) => roundToDecimals((current - prev) / (current || 1), decimals);

export const getRate = (current: number, prev: number, decimals: number = 2) =>
  roundToDecimals(current / (prev || 1), decimals);

export const getAverage = (values: number[], decimals: number = 2) =>
  values?.length
    ? roundToDecimals(
        values.reduce((acc, value) => acc + value, 0) / values.length,
        decimals,
      )
    : 0;

export const roundToDecimals = (value: number, decimals: number = 0) => {
  return (
    Math.round((value + Number.EPSILON) * Math.pow(10, decimals)) /
    Math.pow(10, decimals)
  );
};

export const convertFunds = (
  amount: string | number | bigint,
  conversionFactor: number = 1,
): Decimal => new Decimal(String(amount)).div(conversionFactor);

export const getDailyIntervals = (
  from: number,
  to: number,
): { start: number; end: number }[] => {
  const days = [];

  for (let time = from; time <= to; time += 86400000 /* 1 day increment */) {
    days.push({
      start: moment(time).startOf('day').valueOf(),
      end: moment(time).endOf('day').valueOf(),
    });
  }

  return days;
};

export const patchMetricDays = (
  metricQuery: MetricQuery,
  metrics: Metric[],
  type: MetricType,
) => {
  if (!metrics || !metrics.length) {
    return metrics;
  }

  const { from, to } = metricQuery;
  const days = getDailyIntervals(Math.max(metrics[0].timestamp, from), to);

  return days.map((day) => {
    let metric = metrics.find(({ timestamp }) =>
      moment(timestamp).isSame(moment(day.end), 'day'),
    );

    if (metric) {
      return {
        ...metric,
        timestamp: moment(metric.timestamp).endOf('day').valueOf(),
      };
    }

    switch (type) {
      case MetricType.Total:
        metric = metrics
          .filter(({ timestamp }) =>
            moment(timestamp).isBefore(moment(day.end), 'day'),
          )
          .pop();

        metric = {
          timestamp: day.end,
          count: metric?.count || 0,
        };

        break;
      case MetricType.Daily:
        metric = {
          timestamp: day.end,
          count: 0,
        };
        break;
    }

    return metric;
  });
};
