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
import { Public } from '@nestjs/authentication';
import { ADMIN_ROLES, Roles, RolesGuard } from '../auth/roles.js';
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

  @Get()
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  findAll(@Query('status') status?: string) {
    return this.requests.findAll(status);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  setStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.requests.setStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.requests.remove(id);
  }
}
