import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Contract } from '@dao-stats/common';
import { ContractResponse } from './dto';

@Injectable()
export class ContractService {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async find(): Promise<ContractResponse[]> {
    return this.contractRepository.find();
  }

  async findById(contractId: string): Promise<ContractResponse> {
    return this.contractRepository.findOne({ contractId });
  }
}
