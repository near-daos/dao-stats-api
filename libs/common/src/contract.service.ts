import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Contract } from '@dao-stats/common';
import { ContractDto } from './dto';

@Injectable()
export class ContractService {
  constructor(
    private readonly configService: ConfigService,

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
