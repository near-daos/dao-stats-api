export enum DaoStatsMetric {
  DaoCount = 'DAO_COUNT' /* total count of DAOs on platform */,
  AccountBalance = 'ACCOUNT_BALANCE' /* contract's account balance */,
  ActionsInCount = 'ACTIONS_IN_COUNT' /* total count of incoming receipt actions */,
  ActionsOutCount = 'ACTIONS_OUT_COUNT' /* total count of outgoing receipt actions */,
  ActionsFunctionCallInCount = 'ACTIONS_FUNCTION_CALL_IN_COUNT' /* total count of incoming receipt actions with action_kind = FUNCTION_CALL */,
  ActionsFunctionCallOutCount = 'ACTIONS_FUNCTION_CALL_OUT_COUNT' /* total count of outgoing receipt actions with action_kind = FUNCTION_CALL */,
  ActionsDepositInCount = 'ACTIONS_DEPOSIT_IN_COUNT' /* TODO deprecated */,
  ActionsDepositInValue = 'ACTIONS_DEPOSIT_IN_VALUE' /* TODO deprecated */,
  ActionsDepositOutCount = 'ACTIONS_DEPOSIT_OUT_COUNT' /* TODO deprecated */,
  ActionsDepositOutValue = 'ACTIONS_DEPOSIT_OUT_VALUE' /* TODO deprecated */,
  ActionsDepositInternalInCount = 'ACTIONS_DEPOSIT_INTERNAL_IN_COUNT' /* total count of incoming receipt actions with args.deposit from any platform account */,
  ActionsDepositInternalInValue = 'ACTIONS_DEPOSIT_INTERNAL_IN_VALUE' /* total value of incoming receipt actions with args.deposit in NEAR from any platform account */,
  ActionsDepositInternalOutCount = 'ACTIONS_DEPOSIT_INTERNAL_OUT_COUNT' /* total count of outgoing receipt actions with args.deposit to any platform account */,
  ActionsDepositInternalOutValue = 'ACTIONS_DEPOSIT_INTERNAL_OUT_VALUE' /* total value of outgoing receipt actions with args.deposit in NEAR to any platform account */,
  ActionsDepositExternalInCount = 'ACTIONS_DEPOSIT_EXTERNAL_IN_COUNT' /* total count of incoming receipt actions with args.deposit from any platform account */,
  ActionsDepositExternalInValue = 'ACTIONS_DEPOSIT_EXTERNAL_IN_VALUE' /* total value of incoming receipt actions with args.deposit in NEAR from any platform account  */,
  ActionsDepositExternalOutCount = 'ACTIONS_DEPOSIT_EXTERNAL_OUT_COUNT' /* total count of outgoing receipt actions with args.deposit to any platform account */,
  ActionsDepositExternalOutValue = 'ACTIONS_DEPOSIT_EXTERNAL_OUT_VALUE' /* total value of outgoing receipt actions with args.deposit in NEAR to any platform account */,
  GroupsCount = 'GROUPS_COUNT' /* total count of groups in contract's policy */,
  CouncilSize = 'COUNCIL_SIZE' /* total size of council group in contract's policy */,
  MembersCount = 'MEMBERS_COUNT' /* total count of unique members of all groups in contract's policy */,
  ProposalsCount = 'PROPOSALS_COUNT' /* total count of proposals in contract */,
  ProposalsTransferCount = 'PROPOSALS_TRANSFER_COUNT' /* total count of proposals with kind = Transfer */,
  ProposalsCouncilMemberCount = 'PROPOSALS_COUNCIL_MEMBER_COUNT' /* total count of proposals to add or remove council member */,
  ProposalsPolicyChangeCount = 'PROPOSALS_POLICY_CHANGE_COUNT' /* total count of proposals with kind = PolicyChange */,
  ProposalsInProgressCount = 'PROPOSALS_IN_PROGRESS_COUNT' /* total count of proposals with status = InProgress */,
  ProposalsApprovedCount = 'PROPOSALS_APPROVED_COUNT' /* total count of proposals with status = Approved */,
  ProposalsRejectedCount = 'PROPOSALS_REJECTED_COUNT' /* total count of proposals with status = Rejected */,
  ProposalsExpiredCount = 'PROPOSALS_EXPIRED_COUNT' /* total count of proposals with status = Expired */,
  ProposalsBountyCount = 'PROPOSALS_BOUNTY_COUNT' /* total count of proposals with kind = AddBounty | BountyDone */,
  ProposalsMemberCount = 'PROPOSALS_MEMBER_COUNT' /* total count of proposals with kind = AddMemberToRole | RemoveMemberFromRole */,
  BountiesCount = 'BOUNTIES_COUNT' /* total count of bounties in contract */,
  BountiesValueLocked = 'BOUNTIES_VALUE_LOCKED' /* total amount of bounties in contract */,
  FtsCount = 'FTS_COUNT' /* total count of FTs belong to contract */,
  FtsValueLocked = 'FTS_VALUE_LOCKED' /* total value of FTs belong to contract */,
  NftsCount = 'NFTS_COUNT' /* total count of NFTSs belong to contract */,
  NftsValueLocked = 'NFTS_VALUE_LOCKED' /* total value of NFTSs belong to contract */,
}
