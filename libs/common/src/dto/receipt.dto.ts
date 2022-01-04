import { TransactionDto } from '.';
import { ReceiptActionDto } from './receipt-action.dto';

export class ReceiptDto {
  receiptId: string;
  predecessorAccountId: string;
  receiverAccountId: string;
  originatedFromTransactionHash: string;
  originatedFromTransaction: TransactionDto;
  includedInBlockTimestamp: number;
  receiptActions: ReceiptActionDto[];
}
