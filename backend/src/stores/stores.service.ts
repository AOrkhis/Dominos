import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity.js';
import { STORE_SEED } from './stores-seed.data.js';

@Injectable()
export class StoresService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Store) private readonly stores: Repository<Store>,
  ) {}

  /** Seed the 28 real stores on first boot (idempotent). */
  async onApplicationBootstrap() {
    if ((await this.stores.count()) === 0) {
      await this.stores.save(STORE_SEED.map((s) => this.stores.create(s)));
    }
  }

  findAll(): Promise<Store[]> {
    return this.stores.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.stores.findOne({
      where: { id },
      relations: { assignments: { user: true } },
    });
    if (!store) throw new NotFoundException(`Store ${id} not found`);
    return store;
  }
}
