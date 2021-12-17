import { TransactionType, VoteType } from '../types';
import { ReceiptDto } from './receipt.dto';

export class TransactionDto {
  transactionHash: string;
  receipts: ReceiptDto[];
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
