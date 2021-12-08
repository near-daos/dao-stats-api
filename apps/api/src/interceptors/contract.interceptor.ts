import { Observable, throwError } from 'rxjs';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { ContractService } from '../contract/contract.service';

@Injectable()
export class ContractInterceptor implements NestInterceptor {
  constructor(private readonly contractService: ContractService) {}

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

    const entity = await this.contractService.findById(contract);

    if (!entity) {
      return throwError(
        () => new BadRequestException(`Invalid contract name: ${contract}`),
      );
    }

    return next.handle();
  }
}
