import { ContractIdRelationMigration } from './contract-id-relation.migration';
import { ReceiptActionArgsMigration } from './receipt-action-args.migration';
import { ReceiptActionBlockTimestampMigration } from './receipt-action-block-timestamp.migration';
import { TransactionProposalVoteMigration } from './tx-proposal-vote.migration';
import { HistoricalAggregationMigration } from './historical-aggregation.migration';
import { NearPriceHistoryMigration } from './near-price-history.migration';

export default [
  ReceiptActionArgsMigration,
  ContractIdRelationMigration,
  TransactionProposalVoteMigration,
  ReceiptActionBlockTimestampMigration,
  HistoricalAggregationMigration,
  NearPriceHistoryMigration,
];
