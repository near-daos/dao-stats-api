import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '..';

@Entity({ name: 'contracts' })
export abstract class Contract extends BaseEntity {
  @Column()
  @PrimaryColumn()
  contractId: string;

  @Column()
  contractName: string;
  
  @Column({ nullable: true })
  description: string;
}
