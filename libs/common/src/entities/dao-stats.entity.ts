import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { DAOStatsMetric } from '../types';

import { HasContract } from '../interfaces';

@Entity({ name: 'dao_stats' })
export class DAOStats implements HasContract {
  @PrimaryColumn()
  @ManyToOne(() => Contract, (contract) => contract.contractId)
  @JoinColumn({ name: 'contract_id' })
  contractId: string;

  @PrimaryColumn()
  dao: string;

  @PrimaryColumn({ type: 'enum', enum: DAOStatsMetric })
  metric: DAOStatsMetric;

  @Column()
  value: number;
}
