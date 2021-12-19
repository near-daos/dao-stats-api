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

export const yoctoToNear = (yocto: string | number | bigint): Decimal =>
  new Decimal(String(yocto)).div(Decimal.pow(10, 24));

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
