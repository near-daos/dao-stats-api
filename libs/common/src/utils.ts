export const millisToNanos = (millis: number): number => {
  return millis * 1000 * 1000;
};

export const nanosToMillis = (nanos: number): number => {
  return nanos / 1000 / 1000;
};

export const yoctoToPico = (yocto: number): number => {
  // 1 NEAR is 1e24 yocto
  // but PostgreSQL's bigint can handle integer up to 9.22 x 1e18
  // so store NEAR amount in pico...
  return Math.round(yocto / 1e12);
};

export const picoToYocto = (pico: number): number => {
  return pico * 1e12;
};
