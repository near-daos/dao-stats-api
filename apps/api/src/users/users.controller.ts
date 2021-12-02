import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContractInterceptor } from '../interceptors/contract.interceptor';
import { UsersTotalResponse } from './dto/users-total.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({
    status: 200,
    type: UsersTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/')
  async total(
    @Param() context: DaoContractContext,
  ): Promise<UsersTotalResponse> {
    return this.usersService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/history')
  async usersHistory(
    @Param() context: DaoContractContext,
    @Query() metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.totalsHistory(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/leaderboard')
  async usersLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.usersService.leaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: UsersTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/:dao')
  async daoTotal(
    @Param() context: DaoContractContext,
  ): Promise<UsersTotalResponse> {
    return this.usersService.totals(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @ApiParam({
    name: 'contract',
    type: String,
  })
  @Get('/:dao/history')
  async daoUsersHistory(
    @Param() context: DaoContractContext,
    @Query() metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.totalsHistory(context, metricQuery);
  }
}
