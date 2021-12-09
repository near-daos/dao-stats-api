import { ContractIdRelationMigration } from './contract-id-relation.migration';
import { ContractsMigration } from './contracts.migration';
import { ReceiptActionArgsMigration } from './receipt-action-args.migration';
import { TransactionProposalVoteMigration } from './tx-proposal-vote.migration';

export default [
  ContractsMigration,
  ReceiptActionArgsMigration,
  ContractIdRelationMigration,
  TransactionProposalVoteMigration,
];
