export const getGrowth = (current: number, prev: number) =>
  Math.round(((current - prev) / current) * 10000) / 100;
