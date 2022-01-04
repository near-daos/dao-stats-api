import Decimal from 'decimal.js';

export const millisToNanos = (millis: number): bigint => {
  return BigInt(Decimal.mul(millis, 1e6).toString());
};

export const nanosToMillis = (nanos: bigint): number => {
  return Decimal.div(String(nanos), 1e6).toNumber();
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

export const convertFunds = (
  amount: string | number | bigint,
  decimals = 0,
): Decimal => new Decimal(String(amount)).div(Math.pow(10, decimals));

export const decodeBase64 = (b: string) => {
  return Buffer.from(b, 'base64').toString('utf-8');
};
