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
import { ADMIN_ROLES, MANAGER_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { User } from './user.entity.js';
import { UsersService } from './users.service.js';

/**
 * Read/create: admins + supervisors (supervisors are scoped to their
 * stores inside the service). Modify/delete: admins only.
 */
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(...MANAGER_ROLES)
  findAll(@CurrentUser() caller: User) {
    return this.users.findAll(caller);
  }

  @Get(':id')
  @Roles(...MANAGER_ROLES)
  findOne(@Param('id') id: string, @CurrentUser() caller: User) {
    return this.users.findOneVisible(id, caller);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  create(
    @Body()
    body: { name?: string; email?: string; password?: string; role?: string },
    @CurrentUser() caller: User,
  ) {
    return this.users.create(body, caller);
  }

  @Patch(':id')
  @Roles(...MANAGER_ROLES)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; isActive?: boolean },
    @CurrentUser() caller: User,
  ) {
    return this.users.update(id, body, caller);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(...MANAGER_ROLES)
  remove(@Param('id') id: string, @CurrentUser() caller: User) {
    return this.users.remove(id, caller);
  }
}
