import { ApiProperty } from '@nestjs/swagger';

export class ProposalsTypes {
  @ApiProperty()
  payout: number;

  @ApiProperty()
  councilMember: number;

  @ApiProperty()
  policyChange: number;

  @ApiProperty()
  expired: number;
}
