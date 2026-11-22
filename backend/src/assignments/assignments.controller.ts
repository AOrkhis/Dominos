import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service.js';

@Controller('assignments')
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
