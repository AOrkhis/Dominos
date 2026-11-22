import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, MaterialCategory } from './material.entity.js';
import { MATERIAL_SEED } from './materials-seed.data.js';

const CATEGORIES = Object.values(MaterialCategory);

export interface MaterialBody {
  name?: string;
  detail?: string;
  leadTime?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class MaterialsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Material)
    private readonly materials: Repository<Material>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.materials.count()) === 0)
      await this.materials.save(MATERIAL_SEED.map((m) => this.materials.create(m)));
  }

  findAll(): Promise<Material[]> {
    return this.materials.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' },
    });
  }

  findAllAdmin(): Promise<Material[]> {
    return this.materials.find({
      order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' },
    });
  }

  private check(body: MaterialBody, partial = false) {
    if ((!partial || body.category !== undefined) && !CATEGORIES.includes(body.category as MaterialCategory))
      throw new BadRequestException(`category must be one of: ${CATEGORIES.join(', ')}`);
    if (!partial || body.name !== undefined) {
      if (!body.name?.trim()) throw new BadRequestException('name is required');
    }
  }

  create(body: MaterialBody): Promise<Material> {
    this.check(body);
    return this.materials.save(
      this.materials.create({
        name: body.name!.trim(),
        detail: body.detail?.trim() ?? '',
        leadTime: body.leadTime?.trim() ?? '7 days',
        category: body.category as MaterialCategory,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      }),
    );
  }

  async update(id: string, body: MaterialBody): Promise<Material> {
    const material = await this.materials.findOne({ where: { id } });
    if (!material) throw new NotFoundException(`Material ${id} not found`);
    this.check(body, true);
    if (body.name !== undefined) material.name = body.name.trim();
    if (body.detail !== undefined) material.detail = body.detail.trim();
    if (body.leadTime !== undefined) material.leadTime = body.leadTime.trim();
    if (body.category !== undefined) material.category = body.category as MaterialCategory;
    if (body.sortOrder !== undefined) material.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) material.isActive = body.isActive;
    return this.materials.save(material);
  }

  async remove(id: string): Promise<void> {
    const result = await this.materials.delete({ id });
    if (!result.affected) throw new NotFoundException(`Material ${id} not found`);
  }
}
