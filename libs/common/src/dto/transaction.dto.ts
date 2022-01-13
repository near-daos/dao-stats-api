import { TransactionType, VoteType } from '../types';

export class TransactionDto {
  transactionHash: string;
  receiverAccountId: string;
  signerAccountId: string;
  status?: string;
  convertedIntoReceiptId: string;
  receiptConversionGasBurnt: string;
  receiptConversionTokensBurnt: string;
  blockTimestamp: bigint;
  type: TransactionType;
  voteType?: VoteType;
}
