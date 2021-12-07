import { ApiProperty } from '@nestjs/swagger';
import { TvlBountiesLeaderboard } from './tvl-bounties-leaderboard.dto';

export class TvlBountiesLeaderboardResponse {
  @ApiProperty()
  metrics: TvlBountiesLeaderboard[];
}
