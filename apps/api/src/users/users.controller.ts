import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricQueryPipe,
  MetricResponse,
  LeaderboardMetricResponse,
} from '@dao-stats/common';
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
  @Get('/')
  async totals(@Param() context: ContractContext): Promise<UsersTotalResponse> {
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
  @Get('/users')
  async users(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.users(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/users/leaderboard')
  async usersLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.usersService.usersLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/members')
  async members(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.members(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/members/leaderboard')
  async membersLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.usersService.membersLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/average-users')
  async council(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.averageUsers(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/interactions')
  async interactions(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.interactions(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/interactions/leaderboard')
  async interactionsLeaderboard(
    @Param() context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.usersService.interactionsLeaderboard(context);
  }

  @ApiResponse({
    status: 200,
    type: LeaderboardMetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/average-interactions')
  async interactionsAverage(
    @Param() context: ContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.averageInteractions(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: UsersTotalResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao')
  async daoTotals(
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
  @Get('/:dao/users')
  async daoUsers(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.users(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao/members')
  async daoMembers(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.members(context, metricQuery);
  }

  @ApiResponse({
    status: 200,
    type: MetricResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @UseInterceptors(ContractInterceptor)
  @Get('/:dao/interactions')
  async daoInteractions(
    @Param() context: DaoContractContext,
    @Query(MetricQueryPipe) metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.usersService.interactions(context, metricQuery);
  }
}
