import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this, { order: 1 });
  }

  validate({ sub }: JwtClaims) {
    // Fresh load every request: a deleted or deactivated user is rejected at once.
    return sub ? this.users.findOne({ where: { id: sub, isActive: true } }) : null;
  }
}
