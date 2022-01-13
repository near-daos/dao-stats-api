import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contract } from './contract.entity';
import { DaoStatsMetric } from '../types';

import { HasContract } from '../interfaces';

@Entity({ name: 'dao_stats_history' })
export class DaoStatsHistory implements HasContract {
  @PrimaryColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date?: string;

  @PrimaryColumn()
  @ManyToOne(() => Contract, (contract) => contract.contractId)
  @JoinColumn({ name: 'contract_id' })
  contractId: string;

  @PrimaryColumn({ type: 'enum', enum: DaoStatsMetric })
  metric: DaoStatsMetric;

  @PrimaryColumn()
  dao: string;

  @Column({ type: 'double precision', nullable: false, default: 0 })
  total: number;

  @Column({ type: 'double precision', nullable: true })
  change: number;

  @CreateDateColumn({
    type: 'timestamptz',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;
}
