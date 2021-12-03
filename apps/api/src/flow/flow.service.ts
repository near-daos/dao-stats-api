import { millisToNanos } from '@dao-stats/astro/utils';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { FlowTotalResponse } from './dto/flow-total.dto';
import moment from 'moment';

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
