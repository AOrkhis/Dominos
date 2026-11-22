import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
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
}
