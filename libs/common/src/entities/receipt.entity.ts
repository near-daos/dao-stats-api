import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Contract } from '.';
import { HasContract } from '../interfaces';

import { ReceiptAction } from './receipt-action.entity';
import { Transaction } from './transaction.entity';

@Entity({ name: 'receipts' })
export class Receipt implements HasContract {
  @PrimaryColumn()
  receiptId: string;

  @Column({ nullable: true })
  @ManyToOne(() => Contract, (contract) => contract.contractId)
  @JoinColumn({ name: 'contract_id' })
  contractId: string;

  @Column()
  predecessorAccountId: string;

  @Column()
  receiverAccountId: string;

  @Column()
  originatedFromTransactionHash: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.receipts, {
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'originated_from_transaction_hash' })
  originatedFromTransaction: Transaction;

  @Column({ type: 'bigint' })
  includedInBlockTimestamp: number;

  @OneToMany(() => ReceiptAction, (receiptAction) => receiptAction.receipt, {
    cascade: ['insert', 'update'],
    nullable: true,
    persistence: false,
  })
  @JoinColumn({ name: 'receipt_id' })
  receiptActions: ReceiptAction[];
}
