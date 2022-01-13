import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { DaoStatsMetric } from '../types';

import { HasContract } from '../interfaces';

@Entity({ name: 'dao_stats' })
export class DaoStats implements HasContract {
  @PrimaryColumn()
  @ManyToOne(() => Contract, (contract) => contract.contractId)
  @JoinColumn({ name: 'contract_id' })
  contractId: string;

  @PrimaryColumn({ type: 'enum', enum: DaoStatsMetric })
  metric: DaoStatsMetric;

  @PrimaryColumn()
  dao: string;

  @Column({ type: 'double precision', default: 0 })
  value: number;
}
