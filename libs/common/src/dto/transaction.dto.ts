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
}
