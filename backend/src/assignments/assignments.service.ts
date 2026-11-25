import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
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

  /** Store ids the caller may manage: their own assignments (empty = admin). */
  private async callerStoreIds(caller: User): Promise<number[]> {
    const rows = await this.assignments.find({
      where: { userId: caller.id },
      select: { storeId: true },
    });
    return rows.map((r) => r.storeId);
  }

  async findAll(filters: { userId?: string; storeId?: number }, caller: User) {
    // Supervisors only see assignments on their own stores.
    const scoped =
      caller.role === UserRole.SUPERVISOR
        ? await this.callerStoreIds(caller)
        : null;
    if (scoped && !scoped.length) return [];
    return this.assignments.find({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.storeId ? { storeId: filters.storeId } : {}),
        ...(scoped ? { storeId: In(scoped) } : {}),
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Assign a store to a user.
   * - supervisor: any number of stores
   * - user: exactly one — assigning a second is rejected
   * - admin / super_admin: see all stores already, assignment is meaningless
   * - a supervisor caller may only assign their own stores, and only to `user` accounts
   */
  async assign(
    body: { userId?: string; storeId?: number },
    caller: User,
  ): Promise<StoreAssignment> {
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

      if (caller.role === UserRole.SUPERVISOR) {
        if (user.role !== UserRole.USER)
          throw new ForbiddenException(
            'Supervisors can only assign stores to user accounts',
          );
        const mine = await manager.count(StoreAssignment, {
          where: { userId: caller.id, storeId: store.id },
        });
        if (!mine)
          throw new ForbiddenException(
            'You can only assign stores you are assigned to yourself',
          );
      }

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
        const saved = await manager.save(
          StoreAssignment,
          manager.create(StoreAssignment, {
            userId: user.id,
            storeId: store.id,
            assignedById: caller.id,
          }),
        );
        // Re-fetch: save() returns the entity without its eager relations.
        return (await manager.findOne(StoreAssignment, {
          where: { id: saved.id },
        }))!;
      } catch (e) {
        if (e instanceof QueryFailedError && e.message.includes('Duplicate'))
          throw new ConflictException(
            `User ${user.id} is already assigned to store ${store.id}`,
          );
        throw e;
      }
    });
  }

  async unassign(id: string, caller: User): Promise<void> {
    const assignment = await this.assignments.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);

    if (caller.role === UserRole.SUPERVISOR) {
      if (assignment.user.role !== UserRole.USER)
        throw new ForbiddenException(
          'Supervisors can only remove user-account assignments',
        );
      const mine = await this.callerStoreIds(caller);
      if (!mine.includes(assignment.storeId))
        throw new ForbiddenException('This store is not assigned to you');
    }

    await this.assignments.delete({ id });
  }
}
