import { millisToNanos } from 'libs/common/utils';
import moment from 'moment';

export const getGrowth = (current: number, prev: number) =>
  Math.round(((current - prev) / current) * 10000) / 100;

export const getDailyIntervals = (
  from: number,
  to: number,
): { start: number; end: number }[] => {
  let timestamp = from;

  const days = [];
  while (true) {
    const dayStart = timestamp;
    const dayEnd = moment(timestamp).add(1, 'days').valueOf();

    if (timestamp >= to) {
      break;
    }

    days.push({
      start: millisToNanos(dayStart),
      end: millisToNanos(dayEnd),
    });

    timestamp = dayEnd;
  }

  return days;
};
