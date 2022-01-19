import { Column, Entity, PrimaryColumn } from 'typeorm';
import { CoinType } from '../types/coin-type';
import { BaseEntity } from './base.entity';

@Entity({ name: 'contracts' })
export class Contract extends BaseEntity {
  @Column()
  @PrimaryColumn()
  contractId: string;

  @Column({ nullable: true })
  contractName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', nullable: true })
  conversionFactor: number;

  @Column({ type: 'text' })
  coin: CoinType;
}
