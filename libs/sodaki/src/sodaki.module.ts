import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { SodakiService } from './sodaki.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [SodakiService],
  exports: [SodakiService],
})
export class SodakiModule {}
