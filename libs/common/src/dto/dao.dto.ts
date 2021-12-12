import { ApiProperty } from '@nestjs/swagger';

export class DaoResponse {
  @ApiProperty()
  dao: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  metadata: Record<string, any>;
}
