import {
  ActionsInCountMetric,
  ActionsOutCountMetric,
  ActionsDepositInCountMetric,
  ActionsDepositInValueMetric,
  ActionsDepositOutCountMetric,
  ActionsDepositOutValueMetric,
  ActionsFunctionCallInCountMetric,
  ActionsFunctionCallOutCountMetric,
} from './actions';
import { BountiesCountMetric, BountiesValueLockedMetric } from './bounties';
import { DaoCountMetric } from './factory';
import { CouncilSizeMetric, MembersCountMetric } from './members';
import { GroupsCountMetric } from './groups';
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
export * from './members';
export * from './proposals';
export * from './tokens';

export const FACTORY_METRICS = [DaoCountMetric];

export const DAO_METRICS = [
  ActionsInCountMetric,
  ActionsOutCountMetric,
  ActionsFunctionCallInCountMetric,
  ActionsFunctionCallOutCountMetric,
  ActionsDepositInCountMetric,
  ActionsDepositInValueMetric,
  ActionsDepositOutCountMetric,
  ActionsDepositOutValueMetric,
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
