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
import { ADMIN_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { AssignmentsService } from './assignments.service.js';

@Controller('assignments')
@UseGuards(RolesGuard)
@Roles(...ADMIN_ROLES)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.assignments.findAll({
      userId,
      storeId: storeId ? Number(storeId) : undefined,
    });
  }

  @Post()
  assign(
    @Body() body: { userId?: string; storeId?: number; assignedById?: string },
  ) {
    return this.assignments.assign(body);
  }

  @Delete(':id')
  @HttpCode(204)
  unassign(@Param('id') id: string) {
    return this.assignments.unassign(id);
  }
}
