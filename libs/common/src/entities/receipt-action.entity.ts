import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Receipt } from './receipt.entity';

@Entity({ name: 'action_receipt_actions' })
export class ReceiptAction {
  @PrimaryColumn()
  receiptId: string;

  @PrimaryColumn()
  indexInActionReceipt: number;

  @ManyToOne((_) => Receipt, (receipt) => receipt.receiptActions, {
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
