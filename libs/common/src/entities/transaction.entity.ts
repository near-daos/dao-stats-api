import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '..';
import { HasContract } from '../interfaces/has-contract.interface';
import { TransactionType } from '../types/transaction-type';

import { Receipt } from './receipt.entity';

@Entity({ name: 'transactions' })
export class Transaction extends BaseEntity implements HasContract {
  @PrimaryColumn()
  transactionHash: string;

  @Column()
  contractId: string;

  @OneToMany(() => Receipt, (receipt) => receipt.originatedFromTransaction, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  receipts: Receipt[];

  @Column()
  receiverAccountId: string;

  @Column()
  signerAccountId: string;

  @Column()
  status?: string;

  @Column()
  convertedIntoReceiptId: string;

  @Column()
  receiptConversionGasBurnt: string;

  @Column()
  receiptConversionTokensBurnt: string;

  @Column({ type: 'bigint' })
  blockTimestamp: number;

  @Column({ nullable: true, type: 'enum', enum: TransactionType })
  type: TransactionType;
}
