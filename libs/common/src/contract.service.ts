import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Contract } from '@dao-stats/common';
import { ContractDto } from './dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async find(): Promise<ContractDto[]> {
    return this.contractRepository.find();
  }

  async findById(contractId: string): Promise<ContractDto> {
    return this.contractRepository.findOne({ contractId });
  }
}
