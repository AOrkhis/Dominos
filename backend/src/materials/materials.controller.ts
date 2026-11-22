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
import { MaterialsService, type MaterialBody } from './materials.service.js';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Public()
  @Get()
  findAll() {
    return this.materials.findAll();
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  findAllAdmin() {
    return this.materials.findAllAdmin();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  create(@Body() body: MaterialBody) {
    return this.materials.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  update(@Param('id') id: string, @Body() body: MaterialBody) {
    return this.materials.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.materials.remove(id);
  }
}
