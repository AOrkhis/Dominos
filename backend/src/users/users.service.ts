import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity.js';

const ROLES = Object.values(UserRole);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.users.find({
      relations: { assignments: { store: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOne({
      where: { id },
      relations: { assignments: { store: true } },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(body: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  }): Promise<User> {
    if (!body.name?.trim()) throw new BadRequestException('name is required');
    if (!body.email?.includes('@'))
      throw new BadRequestException('a valid email is required');
    if (!body.password || body.password.length < 8)
      throw new BadRequestException('password must be at least 8 characters');
    const role = (body.role ?? UserRole.USER) as UserRole;
    if (!ROLES.includes(role))
      throw new BadRequestException(`role must be one of: ${ROLES.join(', ')}`);

    try {
      const user = await this.users.save(
        this.users.create({
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          passwordHash: await bcrypt.hash(body.password, 10),
          role,
        }),
      );
      return this.findOne(user.id);
    } catch (e) {
      if (e instanceof QueryFailedError && e.message.includes('Duplicate'))
        throw new ConflictException('email is already registered');
      throw e;
    }
  }

  async update(
    id: string,
    body: { name?: string; role?: string; isActive?: boolean },
  ): Promise<User> {
    const user = await this.findOne(id);
    if (body.name !== undefined) user.name = body.name.trim();
    if (body.role !== undefined) {
      const role = body.role as UserRole;
      if (!ROLES.includes(role))
        throw new BadRequestException(`role must be one of: ${ROLES.join(', ')}`);
      user.role = role;
    }
    if (body.isActive !== undefined) user.isActive = body.isActive;
    return this.users.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.users.delete({ id });
    if (!result.affected) throw new NotFoundException(`User ${id} not found`);
  }
}
