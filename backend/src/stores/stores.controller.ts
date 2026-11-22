import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { StoresService } from './stores.service.js';

@Public() // the public storefront reads this without signing in

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  findAll() {
    return this.stores.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stores.findOne(id);
  }
}
