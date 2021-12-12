import { ApiProperty } from '@nestjs/swagger';
import { ProposalsTypesLeaderboard } from './proposals-types-leaderboard.dto';

export class ProposalsTypesLeaderboardResponse {
  @ApiProperty({ type: [ProposalsTypesLeaderboard] })
  leaderboard: ProposalsTypesLeaderboard[];
}
