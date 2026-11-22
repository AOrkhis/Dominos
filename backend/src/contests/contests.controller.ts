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

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  update(@Body() body: ContestBody) {
    return this.contests.update(body);
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
