export enum ActionKind {
  FunctionCall = 'FUNCTION_CALL',
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

export enum ExecutionOutcomeStatus {
  Unknown = 'UNKNOWN',
  Failure = 'FAILURE',
  SuccessValue = 'SUCCESS_VALUE',
  SuccessReceiptId = 'SUCCESS_RECEIPT_ID',
}
