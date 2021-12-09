import { Role, RoleGroup } from './types';

export const btoaJSON = (b: string) => {
  try {
    return JSON.parse(Buffer.from(b, 'base64').toString('utf-8'));
  } catch (e) {}
};

export const isRoleGroup = (role: Role) => {
  return (role.kind as RoleGroup).Group !== undefined;
};

export const isRoleGroupCouncil = (role: Role) => {
  return isRoleGroup(role) && role.name.toLowerCase() === 'council';
};
