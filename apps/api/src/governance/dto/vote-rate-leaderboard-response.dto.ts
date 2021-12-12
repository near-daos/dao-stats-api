import { ApiProperty } from '@nestjs/swagger';
import { VoteRateLeaderboard } from './vote-rate-leaderboard.dto';

export class VoteRateLeaderboardResponse {
  @ApiProperty({ type: [VoteRateLeaderboard] })
  metrics: VoteRateLeaderboard[];
}
