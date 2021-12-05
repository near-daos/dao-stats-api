import { Role, RoleGroup } from './types';

export const btoaJSON = (b: string) => {
  try {
    return JSON.parse(Buffer.from(b, 'base64').toString('utf-8'));
  } catch (e) {}
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

export const isRoleGroup = (role: Role) => {
  return (role.kind as RoleGroup).Group !== undefined;
};

export const isRoleGroupCouncil = (role: Role) => {
  return isRoleGroup(role) && role.name.toLowerCase() === 'council';
};
