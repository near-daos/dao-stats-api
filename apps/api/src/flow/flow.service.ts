import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Contract,
  ContractContext,
  DaoContractContext,
  millisToNanos,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { FlowTotalResponse } from './dto/flow-total.dto';

@Injectable()
export class FlowService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<FlowTotalResponse> {
    const txCount = await this.transactionService.getTransactionTotalCount(
      context,
    );

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoTxCount =
      await this.transactionService.getTransactionTotalCount(
        context,
        null,
        millisToNanos(dayAgo.valueOf()),
      );

    return {
      transactions: {
        count: txCount,
        growth: Math.floor(((txCount - dayAgoTxCount) / dayAgoTxCount) * 100),
      },
    };
  }
}
