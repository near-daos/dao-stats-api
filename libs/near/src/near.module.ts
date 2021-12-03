import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NearConfigService } from './near-config.service';
import { nearProvider, nearRPCProvider } from './near.provider';

@Module({
  imports: [ConfigModule],
  providers: [NearConfigService, nearProvider, nearRPCProvider],
  exports: [NearConfigService, nearProvider, nearRPCProvider],
})
export class NearModule {}
