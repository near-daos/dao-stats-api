import { ApiProperty } from '@nestjs/swagger';

export class ProposalsTypes {
  @ApiProperty()
  governance: number;

  @ApiProperty()
  financial: number;

  @ApiProperty()
  bounties: number;

  @ApiProperty()
  members: number;
}
