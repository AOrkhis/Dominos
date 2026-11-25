import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { ADMIN_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import {
  ContestsService,
  type ContestBody,
  type EntryBody,
} from './contests.service.js';

@Controller('contest')
export class ContestsController {
  constructor(private readonly contests: ContestsService) {}

  @Public()
  @Get()
  getActive() {
    return this.contests.getActive();
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  getManaged() {
    return this.contests.getManaged();
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  getAllManaged() {
    return this.contests.getAllManaged();
  }

  @Public()
  @Get('winners/latest')
  getLatestCompleted() {
    return this.contests.getLatestCompleted();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  create(@Body() body: ContestBody) {
    return this.contests.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  update(@Param('id') id: string, @Body() body: ContestBody) {
    return this.contests.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.contests.remove(id);
  }

  @Post('entries')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  addEntry(@Body() body: EntryBody) {
    return this.contests.addEntry(body);
  }

  @Patch('entries/:id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateEntry(@Param('id') id: string, @Body() body: EntryBody) {
    return this.contests.updateEntry(id, body);
  }

  @Delete('entries/:id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  removeEntry(@Param('id') id: string) {
    return this.contests.removeEntry(id);
  }
}
