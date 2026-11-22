import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { StoreAssignment } from './store-assignment.entity.js';
import { Store } from '../stores/store.entity.js';
import { User, UserRole } from '../users/user.entity.js';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(StoreAssignment)
    private readonly assignments: Repository<StoreAssignment>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findAll(filters: { userId?: string; storeId?: number }) {
    return this.assignments.find({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.storeId ? { storeId: filters.storeId } : {}),
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Assign a store to a user.
   * - supervisor: any number of stores
   * - user: exactly one — assigning a second is rejected
   * - admin / super_admin: see all stores already, assignment is meaningless
   */
  async assign(body: {
    userId?: string;
    storeId?: number;
    assignedById?: string;
  }): Promise<StoreAssignment> {
    if (!body.userId) throw new BadRequestException('userId is required');
    if (!body.storeId) throw new BadRequestException('storeId is required');

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: body.userId },
      });
      if (!user) throw new NotFoundException(`User ${body.userId} not found`);

      const store = await manager.findOne(Store, {
        where: { id: body.storeId },
      });
      if (!store) throw new NotFoundException(`Store ${body.storeId} not found`);

      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException(
          `${user.role} accounts see all stores — assignments are only for supervisor and user roles`,
        );
      }

      const existing = await manager.count(StoreAssignment, {
        where: { userId: user.id },
      });
      if (user.role === UserRole.USER && existing >= 1) {
        throw new ConflictException(
          'A user account can only be assigned to one store — remove the current assignment first, or upgrade them to supervisor',
        );
      }

      try {
        return await manager.save(
          StoreAssignment,
          manager.create(StoreAssignment, {
            userId: user.id,
            storeId: store.id,
            assignedById: body.assignedById ?? null,
          }),
        );
      } catch (e) {
        if (e instanceof QueryFailedError && e.message.includes('Duplicate'))
          throw new ConflictException(
            `User ${user.id} is already assigned to store ${store.id}`,
          );
        throw e;
      }
    });
  }

  async unassign(id: string): Promise<void> {
    const result = await this.assignments.delete({ id });
    if (!result.affected)
      throw new NotFoundException(`Assignment ${id} not found`);
  }
}
