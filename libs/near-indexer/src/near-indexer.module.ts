import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NearIndexerDBProvider } from './db.provider';
import { NearIndexerService } from './near-indexer.service';

@Module({
  imports: [ConfigModule],
  providers: [NearIndexerService, NearIndexerDBProvider],
  exports: [NearIndexerService, NearIndexerDBProvider],
})
export class NearIndexerModule {}
