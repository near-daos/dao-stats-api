import { ApiProperty } from '@nestjs/swagger';
import { MetricQuery } from '.';
import { ActivityInterval } from '../types/activity-interval';

export class IntervalMetricQuery extends MetricQuery {
  @ApiProperty({
    name: 'interval',
    description: `Activity Interval: e.g ${ActivityInterval.Week}`,
    enum: ActivityInterval,
  })
  interval: ActivityInterval = ActivityInterval.Day;
}
