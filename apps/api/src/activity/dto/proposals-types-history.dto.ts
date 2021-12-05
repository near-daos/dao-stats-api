import { Metric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class ProposalsTypesHistory {
  @ApiProperty()
  payout: Metric[];

  @ApiProperty()
  councilMember: Metric[];

  @ApiProperty()
  policyChange: Metric[];

  @ApiProperty()
  expired: Metric[];
}
