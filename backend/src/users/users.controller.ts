import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { ADMIN_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { User } from './user.entity.js';
import { UsersService } from './users.service.js';

/** User management is admin territory — super admins additionally manage admins. */
@Controller('users')
@UseGuards(RolesGuard)
@Roles(...ADMIN_ROLES)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: { name?: string; email?: string; password?: string; role?: string },
    @CurrentUser() caller: User,
  ) {
    return this.users.create(body, caller);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; isActive?: boolean },
    @CurrentUser() caller: User,
  ) {
    return this.users.update(id, body, caller);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() caller: User) {
    return this.users.remove(id, caller);
  }
}
