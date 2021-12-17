import Decimal from 'decimal.js';

export const millisToNanos = (millis: number): bigint => {
  return BigInt(Decimal.mul(millis, 1e6).toString());
};

export const nanosToMillis = (nanos: bigint): number => {
  return Decimal.div(String(nanos), 1e6).toNumber();
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
