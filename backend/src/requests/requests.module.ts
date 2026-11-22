import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../stores/store.entity.js';
import { MarketingRequest } from './marketing-request.entity.js';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MarketingRequest, Store])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
