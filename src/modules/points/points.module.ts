import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointUpdate } from './point.update';

@Module({
  providers: [PointsService, PointUpdate],
})
export class PointsModule {}
