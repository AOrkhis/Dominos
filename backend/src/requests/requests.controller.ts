import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { ADMIN_ROLES, MANAGER_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { User, UserRole } from '../users/user.entity.js';
import { RequestsService, type RequestBody } from './requests.service.js';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  /** Store staff submit requests — no account needed. */
  @Public()
  @Post()
  create(@Body() body: RequestBody) {
    return this.requests.create(body);
  }

  /**
   * The inbox: admins see everything, supervisors and users only the
   * requests of the stores they're assigned to.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES, UserRole.USER)
  findAll(@CurrentUser() caller: User, @Query('status') status?: string) {
    return this.requests.findAll(status, caller);
  }

  /** Status changes: admins anywhere, supervisors on their own stores. */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  setStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() caller: User,
  ) {
    return this.requests.setStatus(id, status, caller);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.requests.remove(id);
  }
}
