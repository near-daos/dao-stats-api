import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Contract, Receipt } from '.';
import { BaseEntity } from './base.entity';
import { HasContract } from '../interfaces';
import { TransactionType, VoteType } from '../types';

@Entity({ name: 'transactions' })
export class Transaction extends BaseEntity implements HasContract {
  @PrimaryColumn()
  transactionHash: string;

  @Column()
  @ManyToOne(() => Contract, (contract) => contract.contractId)
  @JoinColumn({ name: 'contract_id' })
  contractId: string;

  @OneToMany(() => Receipt, (receipt) => receipt.originatedFromTransaction, {
    cascade: true,
    createForeignKeyConstraints: false,
    persistence: false,
  })
  receipts?: Receipt[];

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

  @Column({
    type: 'bigint',
    transformer: {
      from: (value: string) => BigInt(value),
      to: (value: bigint) => String(value),
    },
  })
  blockTimestamp: bigint;

  @Column({ nullable: true, type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: VoteType, nullable: true })
  voteType?: VoteType;
}
