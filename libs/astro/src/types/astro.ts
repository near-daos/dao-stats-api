export type AccountId = string;
export type NearAmount = string;
export type NearTime = string;

// Matches everyone, who is not matched by other roles.
export type RoleKindEveryone = 'Everyone';

// Member greater or equal than given balance. Can use `1` as non-zero balance.
export type RoleKindMember = {
  Member: number[];
};

// Set of accounts.
export type RoleKindGroup = {
  Group: string[];
};

export type RoleKind = RoleKindEveryone | RoleKindMember | RoleKindGroup;

export enum WeightKind {
  TokenWeight = 'TokenWeight',
  RoleWeight = 'RoleWeight',
}

export interface Role<T = RoleKind> {
  name: string;
  kind: T;
  permissions: string[];
  vote_policy: VotePolicy;
}

export interface VotePolicy {
  weight_kind: WeightKind;
  quorum: number;
  threshold: number[];
}

export interface Policy {
  roles: Role[];
  default_vote_policy: VotePolicy;
  proposal_bond: NearAmount;
  proposal_period: NearAmount;
  bounty_bond: NearAmount;
  bounty_forgiveness_period: NearAmount;
}

export type PolicyResponse = Policy;

export interface Config {
  name: string;
  purpose: string;
  metadata: string;
}

export type ConfigResponse = Config;

export enum ProposalStatus {
  InProgress = 'InProgress',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Removed = 'Removed',
  Expired = 'Expired',
  Moved = 'Moved',
  Failed = 'Failed',
}

export enum Vote {
  Approve,
  Reject,
  Remove,
}

export enum ProposalKind {
  ChangeConfig = 'ChangeConfig',
  ChangePolicy = 'ChangePolicy',
  AddMemberToRole = 'AddMemberToRole',
  RemoveMemberFromRole = 'RemoveMemberFromRole',
  FunctionCall = 'FunctionCall',
  UpgradeSelf = 'UpgradeSelf',
  UpgradeRemote = 'UpgradeRemote',
  Transfer = 'Transfer',
  SetStakingContract = 'SetStakingContract',
  AddBounty = 'AddBounty',
  BountyDone = 'BountyDone',
  Vote = 'Vote',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ProposalKindBody {
  export type ChangeConfig = any;

  export type ChangePolicy = Policy;

  export interface AddMemberToRole {
    member_id: AccountId;
    role: string;
  }

  export interface RemoveMemberFromRole {
    member_id: AccountId;
    role: string;
  }

  export type FunctionCall = any;
  export type UpgradeSelf = any;
  export type UpgradeRemote = any;

  export interface Transfer {
    token_id: AccountId;
    receiver_id: AccountId;
    amount: NearAmount;
    msg: string | null;
  }

  export type SetStakingContract = any;
  export type AddBounty = any;
  export type BountyDone = any;
  export type Vote = any;
}

export type ProposalKindBodies =
  | ProposalKindBody.ChangeConfig
  | ProposalKindBody.ChangePolicy
  | ProposalKindBody.AddMemberToRole
  | ProposalKindBody.RemoveMemberFromRole
  | ProposalKindBody.FunctionCall
  | ProposalKindBody.UpgradeSelf
  | ProposalKindBody.UpgradeRemote
  | ProposalKindBody.Transfer
  | ProposalKindBody.SetStakingContract
  | ProposalKindBody.AddBounty
  | ProposalKindBody.BountyDone
  | ProposalKindBody.Vote;

export interface Proposal {
  id: number;
  proposer: AccountId;
  description: string;
  kind: Record<ProposalKind, ProposalKindBodies>;
  status: ProposalStatus;
  vote_counts: Record<string, [Vote.Approve, Vote.Reject, Vote.Remove]>;
  votes: Record<AccountId, Vote>;
  submission_time: NearTime;
}

export type ProposalsResponse = Proposal[];

export interface Bounty {
  id: number;
  description: string;
  token: string;
  amount: NearAmount;
  times: number;
  max_deadline: NearTime;
}

export type BountiesResponse = Bounty[];

export interface FTokenMetadata {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  reference_hash: string | null;
  decimals: number;
}

export type FTokenMetadataResponse = FTokenMetadata;

export interface NfTokenMetadata {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  base_uri: string | null;
  reference: string | null;
  reference_hash: string | null;
}

export type NfTokenMetadataResponse = NfTokenMetadata;

export interface NfTokenForOwnerMetadata {
  title: string;
  description: string;
  media: string;
  media_hash: string;
  copies: number;
  issued_at: string | null;
  expires_at: string | null;
  starts_at: string | null;
  updated_at: string | null;
  extra: string | null;
  reference: string;
  reference_hash: string;
}

export interface NfTokenForOwnerMintbaseInterface {
  id: number;
  owner_id: Record<'Account', AccountId>;
  approvals: Record<any, any>;
  metadata: NfTokenForOwnerMetadata;
  royalty: null | {
    split_between: Record<AccountId, { numerator: number }>;
    percentage: { numerator: number };
  };
  split_owners: null;
  minter: AccountId;
  loan: null;
  composeable_stats: {
    local_depth: number;
    cross_contract_children: number;
  };
  origin_key: null;
}

export interface NfTokenForOwnerParasInterface {
  token_id: number;
  owner_id: AccountId;
  metadata: NfTokenForOwnerMetadata;
  approved_accounts_ids: Record<any, any>;
}

export type NfTokenForOwnerInterface =
  | NfTokenForOwnerMintbaseInterface
  | NfTokenForOwnerParasInterface;

export type NfTokenForOwnerResponse = NfTokenForOwnerInterface[];
