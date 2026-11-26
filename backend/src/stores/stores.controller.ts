import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { ADMIN_ROLES, Roles, RolesGuard } from '../auth/roles.js';
import { User } from '../users/user.entity.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  /** The caller's stores: all for admin roles, assigned-only for supervisor/user. */
  @Get('mine')
  findMine(@CurrentUser() caller: User) {
    return this.stores.findMine(caller);
  }

  @Public() // the public storefront reads these without signing in
  @Get()
  findAll() {
    return this.stores.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stores.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  create(@Body() body: { id?: number; name?: string; region?: string }) {
    return this.stores.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; region?: string },
  ) {
    return this.stores.update(id, body);
  }
}
