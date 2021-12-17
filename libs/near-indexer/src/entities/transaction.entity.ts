import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { Receipt } from './receipt.entity';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryColumn()
  transactionHash: string;

  @OneToMany(() => Receipt, (receipt) => receipt.originatedFromTransaction, {
    cascade: true,
    createForeignKeyConstraints: false,
    nullable: true,
  })
  receipts: Receipt[];

  @Column()
  receiverAccountId: string;

  @Column()
  signerAccountId: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  convertedIntoReceiptId: string;

  @Column({ nullable: true })
  receiptConversionGasBurnt: string;

  @Column({ nullable: true })
  receiptConversionTokensBurnt: string;

  @Column({
    type: 'bigint',
    transformer: {
      from: (value: string) => BigInt(value),
      to: (value: bigint) => String(value),
    },
  })
  blockTimestamp: bigint;
}
