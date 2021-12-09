import { TransactionType } from '../types/transaction-type';
import { VoteType } from '../types/vote-type';
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
  blockTimestamp: number;
  type: TransactionType;
  voteType?: VoteType;
}
