import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MarketingRequest, RequestStatus } from './marketing-request.entity.js';
import { Store } from '../stores/store.entity.js';
import { StoreAssignment } from '../assignments/store-assignment.entity.js';
import { User, UserRole } from '../users/user.entity.js';

const STATUSES = Object.values(RequestStatus);

export interface RequestBody {
  storeId?: number;
  contact?: string;
  neededBy?: string;
  items?: string[];
  notes?: string;
}

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(MarketingRequest)
    private readonly requests: Repository<MarketingRequest>,
    @InjectRepository(Store) private readonly stores: Repository<Store>,
    @InjectRepository(StoreAssignment)
    private readonly assignments: Repository<StoreAssignment>,
  ) {}

  /** Store ids the caller is assigned to. */
  private async callerStoreIds(caller: User): Promise<number[]> {
    const rows = await this.assignments.find({
      where: { userId: caller.id },
      select: { storeId: true },
    });
    return rows.map((r) => r.storeId);
  }

  /**
   * Admins see every request; supervisors and users only the requests
   * of the stores they're assigned to.
   */
  async findAll(status: string | undefined, caller: User): Promise<MarketingRequest[]> {
    const statusFilter = status ? { status: status as RequestStatus } : {};
    if (caller.role === UserRole.SUPERVISOR || caller.role === UserRole.USER) {
      const mine = await this.callerStoreIds(caller);
      if (!mine.length) return [];
      return this.requests.find({
        where: { ...statusFilter, storeId: In(mine) },
        order: { createdAt: 'DESC' },
      });
    }
    return this.requests.find({
      where: statusFilter,
      order: { createdAt: 'DESC' },
    });
  }

  async create(body: RequestBody): Promise<MarketingRequest> {
    if (!body.storeId) throw new BadRequestException('storeId is required');
    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new BadRequestException('at least one item is required');
    const store = await this.stores.findOne({ where: { id: body.storeId } });
    if (!store) throw new BadRequestException(`Unknown store ${body.storeId}`);
    return this.requests.save(
      this.requests.create({
        storeId: store.id,
        contact: body.contact?.trim() || null,
        neededBy: body.neededBy || null,
        items: body.items.map((i) => String(i).trim()).filter(Boolean),
        notes: body.notes?.trim() || null,
      }),
    );
  }

  async setStatus(id: string, status: string, caller: User): Promise<MarketingRequest> {
    if (!STATUSES.includes(status as RequestStatus))
      throw new BadRequestException(`status must be one of: ${STATUSES.join(', ')}`);
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    if (caller.role === UserRole.SUPERVISOR) {
      const mine = await this.callerStoreIds(caller);
      if (!mine.includes(request.storeId))
        throw new ForbiddenException('This request does not belong to one of your stores');
    }
    request.status = status as RequestStatus;
    return this.requests.save(request);
  }

  async remove(id: string): Promise<void> {
    const result = await this.requests.delete({ id });
    if (!result.affected) throw new NotFoundException(`Request ${id} not found`);
  }
}
