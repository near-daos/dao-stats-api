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
