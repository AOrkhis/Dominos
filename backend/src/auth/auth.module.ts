import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import {
  RefreshToken,
  RevokedRefreshFamily,
} from './refresh-token.entity.js';
import { TypeormRefreshTokenStore } from './refresh-token.store.js';
import './auth.types.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, RevokedRefreshFamily]),
  ],
  controllers: [AuthController],
  providers: [CredentialsService, JwtAuth, TypeormRefreshTokenStore],
})
export class AuthModule {}
