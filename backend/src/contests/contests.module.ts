import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from './contest.entity.js';
import { ContestEntry } from './contest-entry.entity.js';
import { ContestsController } from './contests.controller.js';
import { ContestsService } from './contests.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Contest, ContestEntry])],
  controllers: [ContestsController],
  providers: [ContestsService],
})
export class ContestsModule {}
