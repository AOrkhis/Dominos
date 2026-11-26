import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { StoreAssignment } from '../assignments/store-assignment.entity.js';
import { Store } from '../stores/store.entity.js';
import { User, UserRole } from '../users/user.entity.js';
import { MarketingRequest } from './marketing-request.entity.js';
import { RequestsService } from './requests.service.js';

describe('RequestsService', () => {
  const requestRepo = {
    create: vi.fn((request: Partial<MarketingRequest>) => request),
    save: vi.fn((request: Partial<MarketingRequest>) => Promise.resolve(request)),
  };
  const storeRepo = { findOne: vi.fn() };
  const assignmentRepo = { count: vi.fn() };
  let service: RequestsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RequestsService(
      requestRepo as unknown as Repository<MarketingRequest>,
      storeRepo as unknown as Repository<Store>,
      assignmentRepo as unknown as Repository<StoreAssignment>,
    );
    storeRepo.findOne.mockResolvedValue({ id: 10600 });
    assignmentRepo.count.mockResolvedValue(0);
  });

  const body = { storeId: 10600, items: ['Poster'] };
  const user = { id: 'user-1', role: UserRole.USER } as User;

  it('rejects a request for a store not assigned to a user', async () => {
    await expect(service.create(body, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(requestRepo.save).not.toHaveBeenCalled();
  });

  it('rejects a request for a store not assigned to a supervisor', async () => {
    const supervisor = { id: 'supervisor-1', role: UserRole.SUPERVISOR } as User;

    await expect(service.create(body, supervisor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(requestRepo.save).not.toHaveBeenCalled();
  });

  it('allows a request for an assigned store', async () => {
    assignmentRepo.count.mockResolvedValue(1);

    await service.create(body, user);

    expect(assignmentRepo.count).toHaveBeenCalledWith({
      where: { userId: user.id, storeId: body.storeId },
    });
    expect(requestRepo.save).toHaveBeenCalled();
  });

  it('allows admins to request for any store', async () => {
    const admin = { id: 'admin-1', role: UserRole.ADMIN } as User;

    await service.create(body, admin);

    expect(assignmentRepo.count).not.toHaveBeenCalled();
    expect(requestRepo.save).toHaveBeenCalled();
  });
});
