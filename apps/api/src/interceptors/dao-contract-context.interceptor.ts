import { Observable, throwError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RequestContext } from '@medibloc/nestjs-request-context';

import {
  DaoContractContext,
  DaoService,
  DAO_CONTRACT_CONTEXT,
} from '@dao-stats/common';

@Injectable()
export class DaoContractContextInterceptor implements NestInterceptor {
  constructor(
    private readonly daoService: DaoService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (
      !this.reflector.get<boolean>(DAO_CONTRACT_CONTEXT, context.getHandler())
    ) {
      return next.handle();
    }

    const { params } = context.switchToHttp().getRequest();
    const { contractId, dao } = params;

    if (dao) {
      const daoEntity = await this.daoService.findById(contractId, dao);
      if (!daoEntity) {
        return throwError(
          () =>
            new BadRequestException(
              `DAO '${dao}' is not found in '${contractId}' contract.`,
            ),
        );
      }
    }

    const ctx: DaoContractContext = RequestContext.get();
    ctx.dao = dao;

    return next.handle();
  }
}
