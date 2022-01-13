import { ContractIdRelationMigration } from './contract-id-relation.migration';
import { ContractsMigration } from './contracts.migration';
import { ReceiptActionArgsMigration } from './receipt-action-args.migration';
import { ReceiptActionBlockTimestampMigration } from './receipt-action-block-timestamp.migration';
import { TransactionProposalVoteMigration } from './tx-proposal-vote.migration';
import { HistoricalAggregationMigration } from './historical-aggregation.migration';

export default [
  ContractsMigration,
  ReceiptActionArgsMigration,
  ContractIdRelationMigration,
  TransactionProposalVoteMigration,
  ReceiptActionBlockTimestampMigration,
  HistoricalAggregationMigration,
];
