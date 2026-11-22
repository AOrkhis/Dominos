import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from './user.entity.js';

const ROLES = Object.values(UserRole);

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
    private readonly config: ConfigService,
  ) {}

  /** Seed the first super admin so there is always a way in. */
  async onApplicationBootstrap() {
    const exists = await this.users.exists({
      where: { role: UserRole.SUPER_ADMIN },
    });
    if (exists) return;
    const email = (
      this.config.get<string>('SEED_ADMIN_EMAIL') ?? 'admin@dominos.qc.ca'
    ).toLowerCase();
    const password =
      this.config.get<string>('SEED_ADMIN_PASSWORD') ?? 'change-me-now';
    await this.users.save(
      this.users.create({
        name: 'Super Admin',
        email,
        passwordHash: await this.passwordHasher.hash(password),
        role: UserRole.SUPER_ADMIN,
      }),
    );
    this.logger.log(`Seeded super admin ${email} (password from SEED_ADMIN_PASSWORD)`);
  }

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

  async create(
    body: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    },
    caller: User,
  ): Promise<User> {
    if (!body.name?.trim()) throw new BadRequestException('name is required');
    if (!body.email?.includes('@'))
      throw new BadRequestException('a valid email is required');
    if (!body.password || body.password.length < 8)
      throw new BadRequestException('password must be at least 8 characters');
    const role = (body.role ?? UserRole.USER) as UserRole;
    if (!ROLES.includes(role))
      throw new BadRequestException(`role must be one of: ${ROLES.join(', ')}`);
    if (role === UserRole.SUPER_ADMIN && caller.role !== UserRole.SUPER_ADMIN)
      throw new ForbiddenException('Only a super admin can create a super admin');

    try {
      const user = await this.users.save(
        this.users.create({
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          passwordHash: await this.passwordHasher.hash(body.password),
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
    caller: User,
  ): Promise<User> {
    const user = await this.findOne(id);
    const callerIsSuper = caller.role === UserRole.SUPER_ADMIN;
    if (user.role === UserRole.SUPER_ADMIN && !callerIsSuper)
      throw new ForbiddenException('Only a super admin can modify a super admin');
    if (user.id === caller.id && (body.role !== undefined || body.isActive === false))
      throw new ForbiddenException('You cannot demote or deactivate yourself');
    if (body.name !== undefined) user.name = body.name.trim();
    if (body.role !== undefined) {
      const role = body.role as UserRole;
      if (!ROLES.includes(role))
        throw new BadRequestException(`role must be one of: ${ROLES.join(', ')}`);
      if (role === UserRole.SUPER_ADMIN && !callerIsSuper)
        throw new ForbiddenException('Only a super admin can grant super admin');
      user.role = role;
    }
    if (body.isActive !== undefined) user.isActive = body.isActive;
    return this.users.save(user);
  }

  async remove(id: string, caller: User): Promise<void> {
    if (id === caller.id)
      throw new ForbiddenException('You cannot delete your own account');
    const target = await this.findOne(id);
    if (target.role === UserRole.SUPER_ADMIN && caller.role !== UserRole.SUPER_ADMIN)
      throw new ForbiddenException('Only a super admin can delete a super admin');
    const result = await this.users.delete({ id });
    if (!result.affected) throw new NotFoundException(`User ${id} not found`);
  }
}
