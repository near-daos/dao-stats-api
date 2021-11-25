import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { ContractEntity } from './contract.entity';
import { Receipt } from './receipt.entity';

@Entity({ name: 'transactions' })
export class Transaction extends ContractEntity {
  @PrimaryColumn()
  transactionHash: string;

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
}
