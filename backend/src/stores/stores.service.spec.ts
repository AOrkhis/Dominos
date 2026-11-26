import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Store } from './store.entity.js';
import { StoresService } from './stores.service.js';

describe('StoresService management', () => {
  const storeRepo = {
    create: vi.fn((store: Partial<Store>) => store),
    findOne: vi.fn(),
    save: vi.fn((store: Partial<Store>) => Promise.resolve(store)),
  };
  let service: StoresService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StoresService(storeRepo as unknown as Repository<Store>);
  });

  it('creates a store with a positive integer id', async () => {
    await service.create({ id: 10800, name: 'New Store', region: 'Montréal' });

    expect(storeRepo.create).toHaveBeenCalledWith({
      id: 10800,
      name: 'New Store',
      region: 'Montréal',
    });
    expect(storeRepo.save).toHaveBeenCalled();
  });

  it('rejects invalid ids and blank store details', async () => {
    await expect(
      service.create({ id: 0, name: 'New Store', region: 'Montréal' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create({ id: 10800, name: ' ', region: 'Montréal' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storeRepo.save).not.toHaveBeenCalled();
  });

  it('updates the store name and region without changing its id', async () => {
    const store = { id: 10800, name: 'Old Name', region: 'Old Region' };
    storeRepo.findOne.mockResolvedValue(store);

    const updated = await service.update(10800, {
      name: ' New Name ',
      region: ' New Region ',
    });

    expect(updated).toMatchObject({
      id: 10800,
      name: 'New Name',
      region: 'New Region',
    });
    expect(storeRepo.save).toHaveBeenCalledWith(store);
  });
});
