import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Contest } from './contest.entity.js';
import { ContestEntry } from './contest-entry.entity.js';
import { ContestsService } from './contests.service.js';
import { Store } from '../stores/store.entity.js';

describe('ContestsService', () => {
  const contestRepo = {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn((data: Partial<Contest>) => data),
    save: vi.fn((contest: Partial<Contest>) => Promise.resolve(contest)),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const entryRepo = { find: vi.fn() };
  const storeRepo = { exists: vi.fn() };
  let service: ContestsService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T16:00:00.000Z'));
    vi.clearAllMocks();
    service = new ContestsService(
      contestRepo as unknown as Repository<Contest>,
      entryRepo as unknown as Repository<ContestEntry>,
      storeRepo as unknown as Repository<Store>,
    );
    entryRepo.find.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only returns a contest within its live date range', async () => {
    contestRepo.findOne.mockResolvedValue({
      id: 'contest-1',
      isActive: true,
      startDate: '2026-08-15',
      endDate: '2026-08-15',
    });
    await expect(service.getActive()).resolves.toMatchObject({ id: 'contest-1' });

    contestRepo.findOne.mockResolvedValue({
      id: 'contest-2',
      isActive: true,
      startDate: '2026-08-01',
      endDate: '2026-08-14',
    });
    await expect(service.getActive()).resolves.toBeNull();

    contestRepo.findOne.mockResolvedValue({
      id: 'contest-3',
      isActive: true,
      startDate: '2026-08-16',
      endDate: '2026-08-31',
    });
    await expect(service.getActive()).resolves.toBeNull();
  });

  it('stores three distinct winner stores for a contest', async () => {
    storeRepo.exists.mockResolvedValue(true);
    await service.create({
      title: 'Summer challenge',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      intro: 'Sell more.',
      teamPrize: 'Team dinner',
      storePrize: 'Manager bonus',
      winner1StoreId: 1001,
      winner2StoreId: 1002,
      winner3StoreId: 1003,
    });
    expect(contestRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        winner1StoreId: 1001,
        winner2StoreId: 1002,
        winner3StoreId: 1003,
      }),
    );

    await expect(
      service.create({
        title: 'Duplicate podium',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        intro: 'Sell more.',
        teamPrize: 'Team dinner',
        storePrize: 'Manager bonus',
        winner1StoreId: 1001,
        winner2StoreId: 1001,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
