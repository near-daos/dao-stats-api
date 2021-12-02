import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class MetricQuery {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  from: number;

  @ApiProperty({ required: false })
  @IsNumber()
  to: number = new Date().getTime();
}
