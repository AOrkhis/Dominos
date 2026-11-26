import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity.js';
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

  async create(body: { id?: number; name?: string; region?: string }): Promise<Store> {
    const id = body.id;
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1)
      throw new BadRequestException('id must be a positive integer');
    const name = this.requiredText(body.name, 'name');
    const region = this.requiredText(body.region, 'region');
    try {
      return await this.stores.save(this.stores.create({ id, name, region }));
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.includes('Duplicate'))
        throw new ConflictException(`Store ${id} already exists`);
      throw error;
    }
  }

  async update(
    id: number,
    body: { name?: string; region?: string },
  ): Promise<Store> {
    const store = await this.stores.findOne({ where: { id } });
    if (!store) throw new NotFoundException(`Store ${id} not found`);
    if (body.name !== undefined) store.name = this.requiredText(body.name, 'name');
    if (body.region !== undefined)
      store.region = this.requiredText(body.region, 'region');
    return this.stores.save(store);
  }

  private requiredText(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${field} is required`);
    return value.trim();
  }

  /** Admin roles see all stores; supervisor/user see only assigned ones. */
  findMine(caller: User): Promise<Store[]> {
    if (caller.role === UserRole.ADMIN || caller.role === UserRole.SUPER_ADMIN)
      return this.findAll();
    return this.stores.find({
      where: { assignments: { userId: caller.id } },
      order: { id: 'ASC' },
    });
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
