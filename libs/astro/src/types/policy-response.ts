export type NearAmount = string;

// Matches everyone, who is not matched by other roles.
export type RoleEveryone = 'Everyone';

// Member greater or equal than given balance. Can use `1` as non-zero balance.
export type RoleMember = {
  Member: number[];
};

// Set of accounts.
export type RoleGroup = {
  Group: string[];
};

export type RoleKind = RoleEveryone | RoleMember | RoleGroup;

export enum WeightKind {
  TokenWeight = 'TokenWeight',
  RoleWeight = 'RoleWeight',
}

export interface Role {
  name: string;
  kind: RoleKind;
  permissions: string[];
  vote_policy: VotePolicy;
}

export interface VotePolicy {
  weight_kind: WeightKind;
  quorum: number;
  threshold: number[];
}

export interface PolicyResponse {
  roles: Role[];
  default_vote_policy: VotePolicy;
  proposal_bond: NearAmount;
  proposal_period: NearAmount;
  bounty_bond: NearAmount;
  bounty_forgiveness_period: NearAmount;
}
