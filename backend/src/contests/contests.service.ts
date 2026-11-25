import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest } from './contest.entity.js';
import { ContestEntry, ContestTrend } from './contest-entry.entity.js';
import { CONTEST_SEED } from './contests-seed.data.js';

export interface ContestBody {
  title?: string;
  product?: string;
  startDate?: string;
  endDate?: string;
  intro?: string;
  teamPrize?: string;
  storePrize?: string;
  isActive?: boolean;
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
export class ContestsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Contest) private readonly contests: Repository<Contest>,
    @InjectRepository(ContestEntry)
    private readonly entries: Repository<ContestEntry>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.contests.count()) === 0) {
      const { entries, ...contest } = CONTEST_SEED;
      const saved = await this.contests.save(this.contests.create(contest));
      await this.entries.save(
        entries.map((e) => this.entries.create({ ...e, contestId: saved.id })),
      );
    }
  }

  /** The active contest with its leaderboard, ranked by attach rate. */
  async getActive(): Promise<Contest> {
    const contest = await this.contests.findOne({
      where: { isActive: true },
    });
    if (!contest) throw new NotFoundException('No active contest');
    contest.entries = await this.entries.find({
      where: { contestId: contest.id },
      relations: { store: true },
      order: { upsellRate: 'DESC' },
    });
    return contest;
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
        isActive: true,
      }),
    );
    contest.entries = [];
    return contest;
  }

  async update(body: ContestBody): Promise<Contest> {
    const contest = await this.getActive();
    for (const key of [
      'title',
      'product',
      'startDate',
      'endDate',
      'intro',
      'teamPrize',
      'storePrize',
    ] as const) {
      if (body[key] !== undefined) contest[key] = body[key]!;
    }
    if (body.isActive !== undefined) contest.isActive = body.isActive;
    await this.contests.save(contest);
    return this.getActive();
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
    const contest = await this.getActive();
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
    return this.getActive();
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
    return this.getActive();
  }

  async removeEntry(id: string): Promise<Contest> {
    const result = await this.entries.delete({ id });
    if (!result.affected) throw new NotFoundException(`Entry ${id} not found`);
    return this.getActive();
  }
}
