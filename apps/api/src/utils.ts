import moment from 'moment';
import Decimal from 'decimal.js';
import { Metric, MetricQuery, MetricType } from '@dao-stats/common';

export const getGrowth = (current: number, prev: number) =>
  Math.round(((current - prev) / (current || 1)) * 10000) / 100;

export const getRate = (current: number, prev: number) =>
  Math.round((current / (prev || 1)) * 10000) / 100;

export const getAverage = (values: number[]) =>
  values?.length
    ? Math.round(values.reduce((acc, value) => acc + value, 0) / values.length)
    : 0;

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
