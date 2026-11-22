import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { MANAGER_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { User } from '../users/user.entity.js';
import { AssignmentsService } from './assignments.service.js';

@Controller('assignments')
@UseGuards(RolesGuard)
@Roles(...MANAGER_ROLES)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  findAll(
    @CurrentUser() caller: User,
    @Query('userId') userId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.assignments.findAll(
      { userId, storeId: storeId ? Number(storeId) : undefined },
      caller,
    );
  }

  @Post()
  assign(
    @Body() body: { userId?: string; storeId?: number },
    @CurrentUser() caller: User,
  ) {
    return this.assignments.assign(body, caller);
  }

  @Delete(':id')
  @HttpCode(204)
  unassign(@Param('id') id: string, @CurrentUser() caller: User) {
    return this.assignments.unassign(id, caller);
  }
}
