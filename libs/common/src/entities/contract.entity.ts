import { Column } from 'typeorm';
import { BaseEntity } from '..';

export abstract class ContractEntity extends BaseEntity {
  @Column()
  contractId: string;
}
