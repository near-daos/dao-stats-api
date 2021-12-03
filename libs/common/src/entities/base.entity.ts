import { Exclude } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

export abstract class BaseEntity {
  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'boolean', default: false })
  isArchived?: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @ApiHideProperty()
  @Exclude()
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;
}
