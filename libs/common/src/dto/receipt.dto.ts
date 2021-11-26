import { ReceiptActionDto } from './receipt-action.dto';

export class ReceiptDto {
  receiptId: string;
  predecessorAccountId: string;
  receiverAccountId: string;
  originatedFromTransactionHash: string;
  includedInBlockTimestamp: number;
  receiptActions: ReceiptActionDto[];
}
