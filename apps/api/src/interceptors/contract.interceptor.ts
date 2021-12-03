import { Repository } from 'typeorm';
import { Observable, throwError } from 'rxjs';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Contract } from '@dao-stats/common';

@Injectable()
export class ContractInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const { contract } = context.switchToHttp().getRequest().params;

    if (!contract) {
      return throwError(
        () => new BadRequestException('Tenant(contract) name is missing!'),
      );
    }

    const entity = await this.contractRepository.findOne({
      contractId: contract,
    });

    if (!entity) {
      return throwError(
        () => new BadRequestException(`Invalid contract name: ${contract}`),
      );
    }

    return next.handle();
  }
}
