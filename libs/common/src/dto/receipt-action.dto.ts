import { ReceiptDto } from '.';

export class ReceiptActionDto {
  receiptId: string;
  indexInActionReceipt: number;
  receiptPredecessorAccountId: string;
  receiptReceiverAccountId: string;
  actionKind: string;
  args: Record<string, unknown>;
  receipt: ReceiptDto;
  receiptIncludedInBlockTimestamp: number;
}
