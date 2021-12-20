import Decimal from 'decimal.js';

import { Role, RoleKindGroup } from './types';

export const btoaJSON = (b: string) => {
  try {
    return JSON.parse(Buffer.from(b, 'base64').toString('utf-8'));
  } catch (e) {}
};

export const isRoleGroup = (role: Role) => {
  return (role as Role<RoleKindGroup>).kind.Group !== undefined;
};

export const isRoleGroupCouncil = (role: Role) => {
  return isRoleGroup(role) && role.name.toLowerCase() === 'council';
};

export const yoctoToNear = (yocto: number | string): number => {
  return new Decimal(yocto).div(1e24).toNumber();
};
