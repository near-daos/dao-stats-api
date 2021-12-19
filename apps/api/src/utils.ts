import moment from 'moment';
import Decimal from 'decimal.js';

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
  let timestamp = from;

  const days = [];
  while (true) {
    const dayStart = timestamp;
    const dayEnd = moment(timestamp).add(1, 'days').valueOf();

    if (moment(dayEnd).isAfter(moment(to), 'day')) {
      break;
    }

    days.push({
      start: dayStart,
      end: dayEnd,
    });

    timestamp = dayEnd;
  }

  return days;
};
