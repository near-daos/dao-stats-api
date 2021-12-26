import { Observable, throwError } from 'rxjs';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { RequestContext } from '@medibloc/nestjs-request-context';
import { DaoContractContext, DaoService } from '@dao-stats/common';

@Injectable()
export class DaoContractContextInterceptor implements NestInterceptor {
  constructor(private readonly daoService: DaoService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
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
