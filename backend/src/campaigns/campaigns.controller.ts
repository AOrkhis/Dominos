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
import { Public } from '@nestjs/authentication';
import { ADMIN_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { CampaignsService, type CampaignBody } from './campaigns.service.js';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Public()
  @Get()
  findAll() {
    return this.campaigns.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  create(@Body() body: CampaignBody) {
    return this.campaigns.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  update(@Param('id') id: string, @Body() body: CampaignBody) {
    return this.campaigns.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.campaigns.remove(id);
  }
}
