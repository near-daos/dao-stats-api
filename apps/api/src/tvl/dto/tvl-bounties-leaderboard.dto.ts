import { ApiProperty } from '@nestjs/swagger';
import { TvlBountiesMetric } from './tvl-bounties-metric.dto';

export class TvlBountiesLeaderboard {
  @ApiProperty()
  dao: string;

  @ApiProperty()
  number: TvlBountiesMetric;

  @ApiProperty()
  vl: TvlBountiesMetric;
}
