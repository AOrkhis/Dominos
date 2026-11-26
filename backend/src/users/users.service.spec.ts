import { ForbiddenException } from '@nestjs/common';
import type { PasswordHasher } from '@nestjs/authentication';
import type { ConfigService } from '@nestjs/config';
import type { DataSource, Repository } from 'typeorm';
import { User, UserRole } from './user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService account updates', () => {
  const records = new Map<string, Partial<User>>();
  const usersRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  const passwordHasher = { hash: vi.fn() };
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    records.clear();
    usersRepo.findOne.mockImplementation(async ({ where }: { where: { id: string } }) => {
      const saved = records.get(where.id);
      if (!saved) return null;
      const visible: Partial<User> = {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        role: saved.role,
        isActive: saved.isActive,
        assignments: [],
      };
      delete visible.passwordHash;
      return visible;
    });
    usersRepo.save.mockImplementation(async (saved: User) => {
      records.set(saved.id, {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        role: saved.role,
        isActive: saved.isActive,
        passwordHash: saved.passwordHash,
      });
      return saved;
    });
    passwordHasher.hash.mockResolvedValue('hashed-password');
    service = new UsersService(
      usersRepo as unknown as Repository<User>,
      {} as DataSource,
      passwordHasher as unknown as PasswordHasher,
      {} as ConfigService,
    );
  });

  const addUser = (id: string, role: UserRole) => {
    records.set(id, {
      id,
      name: 'Test User',
      email: `${id}@example.com`,
      role,
      isActive: true,
    });
  };

  it('updates profile and hashes a new password without returning the hash', async () => {
    addUser('user-1', UserRole.USER);
    const admin = { id: 'admin-1', role: UserRole.ADMIN } as User;

    const updated = await service.update(
      'user-1',
      { name: ' Updated Name ', email: 'UPDATED@EXAMPLE.COM', password: 'new-password' },
      admin,
    );

    expect(passwordHasher.hash).toHaveBeenCalledWith('new-password');
    expect(records.get('user-1')).toMatchObject({
      name: 'Updated Name',
      email: 'updated@example.com',
      passwordHash: 'hashed-password',
    });
    expect(updated).toMatchObject({ name: 'Updated Name', email: 'updated@example.com' });
    expect(updated).not.toHaveProperty('passwordHash');
  });

  it('prevents an admin from modifying another admin', async () => {
    addUser('admin-2', UserRole.ADMIN);

    await expect(
      service.update(
        'admin-2',
        { password: 'new-password' },
        { id: 'admin-1', role: UserRole.ADMIN } as User,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('prevents an admin from deleting another admin', async () => {
    addUser('admin-2', UserRole.ADMIN);

    await expect(
      service.remove('admin-2', { id: 'admin-1', role: UserRole.ADMIN } as User),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepo.delete).not.toHaveBeenCalled();
  });

  it('allows a super admin to modify an admin account', async () => {
    addUser('admin-2', UserRole.ADMIN);

    await service.update(
      'admin-2',
      { password: 'new-password' },
      { id: 'super-1', role: UserRole.SUPER_ADMIN } as User,
    );

    expect(usersRepo.save).toHaveBeenCalled();
    expect(records.get('admin-2')?.passwordHash).toBe('hashed-password');
  });
});
