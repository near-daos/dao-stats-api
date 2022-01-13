import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'daos' })
export class Dao extends BaseEntity {
  @Column()
  @PrimaryColumn()
  dao: string;

  @Column()
  @Index()
  contractId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;
}
