import Decimal from 'decimal.js';

export const millisToNanos = (millis: number): number => {
  return millis * 1000 * 1000;
};

export const nanosToMillis = (nanos: number): number => {
  return nanos / 1000 / 1000;
};

export const yoctoToNear = (yocto: number | string): number => {
  return new Decimal(yocto).div(1e24).toNumber();
};

export const findAllByKey = (obj: Record<string, any>, keyToFind: string) => {
  if (!obj) return null;

  return Object.entries(obj).reduce(
    (acc, [key, value]) =>
      key === keyToFind
        ? acc.concat(value)
        : typeof value === 'object'
        ? acc.concat(findAllByKey(value, keyToFind))
        : acc,
    [],
  );
};
