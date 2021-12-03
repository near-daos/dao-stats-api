import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { ReceiptAction } from './receipt-action.entity';
import { Transaction } from './transaction.entity';

@Entity({ name: 'receipts' })
export class Receipt {
  @PrimaryColumn()
  receiptId: string;

  @Column()
  predecessorAccountId: string;

  @Column()
  receiverAccountId: string;

  @Column()
  originatedFromTransactionHash: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.receipts)
  @JoinColumn({ name: 'originated_from_transaction_hash' })
  originatedFromTransaction: Transaction;

  @Column({ type: 'bigint' })
  includedInBlockTimestamp: number;

  @OneToMany(() => ReceiptAction, (receiptAction) => receiptAction.receipt, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: 'receipt_id' })
  receiptActions: ReceiptAction[];
}
