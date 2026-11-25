import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Contest } from './contest.entity.js';
import { ContestEntry, ContestTrend } from './contest-entry.entity.js';
import { Store } from '../stores/store.entity.js';

export interface ContestBody {
  title?: string;
  product?: string;
  startDate?: string;
  endDate?: string;
  intro?: string;
  teamPrize?: string;
  storePrize?: string;
  winner1StoreId?: number | null;
  winner2StoreId?: number | null;
  winner3StoreId?: number | null;
}

export interface EntryBody {
  storeId?: number;
  manager?: string;
  upsellRate?: number;
  qualifyingOrders?: number;
  trend?: string;
}

const TRENDS = Object.values(ContestTrend);

@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest) private readonly contests: Repository<Contest>,
    @InjectRepository(ContestEntry)
    private readonly entries: Repository<ContestEntry>,
    @InjectRepository(Store)
    private readonly stores: Repository<Store>,
  ) {}

  private todayInQuebec(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
    }).format(new Date());
  }

  /** The active contest with its leaderboard, even when it is not currently live. */
  async getManaged(): Promise<Contest | null> {
    const contest = await this.contests.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    if (!contest) return null;
    return this.withEntries(contest);
  }

  private async withEntries(contest: Contest): Promise<Contest> {
    contest.entries = await this.entries.find({
      where: { contestId: contest.id },
      relations: { store: true },
      order: { upsellRate: 'DESC' },
    });
    return contest;
  }

  async getAllManaged(): Promise<Contest[]> {
    const contests = await this.contests.find({
      order: { createdAt: 'DESC' },
    });
    return Promise.all(contests.map((contest) => this.withEntries(contest)));
  }

  async getLatestCompleted(): Promise<Contest | null> {
    return this.contests.findOne({
      where: { endDate: LessThan(this.todayInQuebec()) },
      order: { endDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /** Returns a contest only while its configured date range includes today in Québec. */
  async getActive(): Promise<Contest | null> {
    const contest = await this.getManaged();
    const today = this.todayInQuebec();
    if (!contest || contest.startDate > today || contest.endDate < today)
      return null;
    return contest;
  }

  private async validateWinnerStores(body: ContestBody) {
    const ids = [
      body.winner1StoreId,
      body.winner2StoreId,
      body.winner3StoreId,
    ].filter((id): id is number => id !== undefined && id !== null);
    if (ids.some((id) => !Number.isInteger(id) || id <= 0))
      throw new BadRequestException('Winner store IDs must be positive integers');
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException('Each podium place must have a different store');
    for (const id of ids) {
      if (!(await this.stores.exists({ where: { id } })))
        throw new BadRequestException(`Store ${id} does not exist`);
    }
  }

  async create(body: ContestBody): Promise<Contest> {
    for (const key of ['title', 'startDate', 'endDate', 'intro', 'teamPrize', 'storePrize'] as const) {
      if (!body[key]?.trim()) {
        throw new BadRequestException(`${key} is required`);
      }
    }
    if (body.startDate! > body.endDate!) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    await this.validateWinnerStores(body);

    await this.contests.update({ isActive: true }, { isActive: false });
    const contest = await this.contests.save(
      this.contests.create({
        title: body.title!.trim(),
        product: body.product?.trim() || 'Upsell',
        startDate: body.startDate!,
        endDate: body.endDate!,
        intro: body.intro!.trim(),
        teamPrize: body.teamPrize!.trim(),
        storePrize: body.storePrize!.trim(),
        winner1StoreId: body.winner1StoreId ?? null,
        winner2StoreId: body.winner2StoreId ?? null,
        winner3StoreId: body.winner3StoreId ?? null,
        isActive: true,
      }),
    );
    contest.entries = [];
    return contest;
  }

  async update(id: string, body: ContestBody): Promise<Contest> {
    const contest = await this.contests.findOne({
      where: { id },
    });
    if (!contest) throw new NotFoundException(`Contest ${id} not found`);
    await this.validateWinnerStores(body);
    for (const key of [
      'winner1StoreId',
      'winner2StoreId',
      'winner3StoreId',
    ] as const) {
      if (body[key] !== undefined) contest[key] = body[key] ?? null;
    }
    for (const key of [
      'title',
      'product',
      'startDate',
      'endDate',
      'intro',
      'teamPrize',
      'storePrize',
    ] as const) {
      if (body[key] !== undefined) contest[key] = body[key]!.trim();
    }
    if (
      !contest.title.trim() ||
      !contest.startDate ||
      !contest.endDate ||
      !contest.intro.trim() ||
      !contest.teamPrize.trim() ||
      !contest.storePrize.trim()
    ) {
      throw new BadRequestException('Contest fields cannot be empty');
    }
    if (contest.startDate > contest.endDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    await this.contests.save(contest);
    return this.withEntries(contest);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const contest = await this.contests.findOne({
      where: { id },
    });
    if (!contest) throw new NotFoundException(`Contest ${id} not found`);
    await this.entries.delete({ contestId: id });
    await this.contests.delete({ id });
    return { deleted: true };
  }

  private checkEntry(body: EntryBody, partial = false) {
    if (!partial || body.storeId !== undefined) {
      if (!body.storeId) throw new BadRequestException('storeId is required');
    }
    if (!partial || body.manager !== undefined) {
      if (!body.manager?.trim()) throw new BadRequestException('manager is required');
    }
    if (body.trend !== undefined && !TRENDS.includes(body.trend as ContestTrend))
      throw new BadRequestException(`trend must be one of: ${TRENDS.join(', ')}`);
  }

  async addEntry(body: EntryBody): Promise<Contest> {
    this.checkEntry(body);
    const contest = await this.getManaged();
    if (!contest) throw new NotFoundException('No contest to add an entry to');
    await this.entries.save(
      this.entries.create({
        contestId: contest.id,
        storeId: body.storeId!,
        manager: body.manager!.trim(),
        upsellRate: body.upsellRate ?? 0,
        qualifyingOrders: body.qualifyingOrders ?? 0,
        trend: (body.trend as ContestTrend) ?? ContestTrend.SAME,
      }),
    );
    const updated = await this.getManaged();
    if (!updated) throw new NotFoundException('Contest not found');
    return updated;
  }

  async updateEntry(id: string, body: EntryBody): Promise<Contest> {
    const entry = await this.entries.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`Entry ${id} not found`);
    this.checkEntry(body, true);
    if (body.manager !== undefined) entry.manager = body.manager.trim();
    if (body.upsellRate !== undefined) entry.upsellRate = body.upsellRate;
    if (body.qualifyingOrders !== undefined)
      entry.qualifyingOrders = body.qualifyingOrders;
    if (body.trend !== undefined) entry.trend = body.trend as ContestTrend;
    await this.entries.save(entry);
    const updated = await this.getManaged();
    if (!updated) throw new NotFoundException('Contest not found');
    return updated;
  }

  async removeEntry(id: string): Promise<Contest> {
    const result = await this.entries.delete({ id });
    if (!result.affected) throw new NotFoundException(`Entry ${id} not found`);
    const updated = await this.getManaged();
    if (!updated) throw new NotFoundException('Contest not found');
    return updated;
  }
}
