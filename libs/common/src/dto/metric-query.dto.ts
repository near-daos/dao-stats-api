import { IsNotEmpty, IsNumber } from 'class-validator';

export class MetricQuery {
  @IsNotEmpty()
  @IsNumber()
  from: number;

  @IsNotEmpty()
  @IsNumber()
  to: number = new Date().getTime();
}
