import { Role, RoleGroup } from './types';

export const btoaJSON = (b: string) => {
  try {
    return JSON.parse(Buffer.from(b, 'base64').toString('utf-8'));
  } catch (e) {}
};

export const findAllByKey = (obj: Object, keyToFind: string) => {
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

export const millisToNanos = (millis: number): number => {
  return millis * 1000 * 1000;
};

export const nanosToMillis = (nanos: number): number => {
  return nanos / 1000 / 1000;
};

export const daysFromDate = (date: Date, days?: number): Date => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + (days || 0),
  );
};

export const isRoleGroup = (role: Role) => {
  return (role.kind as RoleGroup).Group !== undefined;
};

export const isRoleGroupCouncil = (role: Role) => {
  return isRoleGroup(role) && ['council', 'Council'].includes(role.name);
};
