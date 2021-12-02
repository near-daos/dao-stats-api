import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Contract } from '.';
import { HasContract } from '../interfaces';

import { Receipt } from './receipt.entity';

@Entity({ name: 'action_receipt_actions' })
export class ReceiptAction implements HasContract {
  @PrimaryColumn()
  receiptId: string;

  @Column({ nullable: true })
  @ManyToOne(() => Contract, (contract) => contract.contractId)
  @JoinColumn({ name: 'contract_id' })
  contractId: string;

  @PrimaryColumn()
  indexInActionReceipt: number;

  @ManyToOne(() => Receipt, (receipt) => receipt.receiptActions, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'receipt_id' })
  receipt?: Receipt;

  @Column()
  receiptPredecessorAccountId: string;

  @Column()
  receiptReceiverAccountId: string;

  @Column()
  actionKind: string;

  @Column({ type: 'simple-json' })
  args: Record<string, unknown>;
}
