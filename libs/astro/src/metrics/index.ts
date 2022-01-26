import { AccountBalanceMetric } from './account';
import {
  ActionsDepositExternalInCountMetric,
  ActionsDepositExternalInValueMetric,
  ActionsDepositExternalOutCountMetric,
  ActionsDepositExternalOutValueMetric,
  ActionsDepositInternalInCountMetric,
  ActionsDepositInternalInValueMetric,
  ActionsDepositInternalOutCountMetric,
  ActionsDepositInternalOutValueMetric,
  ActionsFunctionCallInCountMetric,
  ActionsFunctionCallOutCountMetric,
  ActionsInCountMetric,
  ActionsOutCountMetric,
} from './actions';
import { BountiesCountMetric, BountiesValueLockedMetric } from './bounties';
import { DaoCountMetric } from './factory';
import {
  CouncilSizeMetric,
  GroupsCountMetric,
  MembersCountMetric,
} from './groups';
import {
  ProposalsApprovedCountMetric,
  ProposalsBountyCountMetric,
  ProposalsCouncilMemberCountMetric,
  ProposalsCountMetric,
  ProposalsExpiredCountMetric,
  ProposalsInProgressCountMetric,
  ProposalsMemberCountMetric,
  ProposalsPolicyChangeCountMetric,
  ProposalsRejectedCountMetric,
  ProposalsTransferCountMetric,
} from './proposals';
import {
  FtsCountMetric,
  FtsValueLockedMetric,
  NftsCountMetric,
} from './tokens';

export * from './actions';
export * from './bounties';
export * from './factory';
export * from './proposals';
export * from './tokens';

export const FACTORY_METRICS = [DaoCountMetric];

export const FACTORY_HISTORICAL_METRICS = [DaoCountMetric];

export const DAO_METRICS = [
  AccountBalanceMetric,
  ActionsInCountMetric,
  ActionsOutCountMetric,
  ActionsFunctionCallInCountMetric,
  ActionsFunctionCallOutCountMetric,
  ActionsDepositInternalInCountMetric,
  ActionsDepositInternalInValueMetric,
  ActionsDepositInternalOutCountMetric,
  ActionsDepositInternalOutValueMetric,
  ActionsDepositExternalInCountMetric,
  ActionsDepositExternalInValueMetric,
  ActionsDepositExternalOutCountMetric,
  ActionsDepositExternalOutValueMetric,
  CouncilSizeMetric,
  GroupsCountMetric,
  MembersCountMetric,
  ProposalsCountMetric,
  ProposalsMemberCountMetric,
  ProposalsCouncilMemberCountMetric,
  ProposalsPolicyChangeCountMetric,
  ProposalsTransferCountMetric,
  ProposalsBountyCountMetric,
  ProposalsInProgressCountMetric,
  ProposalsApprovedCountMetric,
  ProposalsRejectedCountMetric,
  ProposalsExpiredCountMetric,
  BountiesCountMetric,
  BountiesValueLockedMetric,
  FtsCountMetric,
  FtsValueLockedMetric,
  NftsCountMetric,
];

export const DAO_HISTORICAL_METRICS = [
  AccountBalanceMetric,
  ActionsFunctionCallInCountMetric,
  ActionsFunctionCallOutCountMetric,
  ActionsDepositInternalInCountMetric,
  ActionsDepositInternalInValueMetric,
  ActionsDepositInternalOutCountMetric,
  ActionsDepositInternalOutValueMetric,
  ActionsDepositExternalInCountMetric,
  ActionsDepositExternalInValueMetric,
  ActionsDepositExternalOutCountMetric,
  ActionsDepositExternalOutValueMetric,
  ProposalsCountMetric,
  ProposalsBountyCountMetric,
  ProposalsCouncilMemberCountMetric,
  ProposalsMemberCountMetric,
  ProposalsPolicyChangeCountMetric,
  ProposalsTransferCountMetric,
];
