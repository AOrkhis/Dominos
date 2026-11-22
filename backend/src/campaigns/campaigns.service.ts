import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignType } from './campaign.entity.js';
import { CAMPAIGN_SEED } from './campaigns-seed.data.js';

const TYPES = Object.values(CampaignType);

export interface CampaignBody {
  title?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  description?: string;
}

@Injectable()
export class CampaignsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaigns: Repository<Campaign>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.campaigns.count()) === 0)
      await this.campaigns.save(CAMPAIGN_SEED.map((c) => this.campaigns.create(c)));
  }

  findAll(): Promise<Campaign[]> {
    return this.campaigns.find({ order: { startDate: 'ASC' } });
  }

  private validate(body: CampaignBody, partial = false) {
    if (!partial || body.title !== undefined) {
      if (!body.title?.trim()) throw new BadRequestException('title is required');
    }
    if (!partial || body.type !== undefined) {
      const type = body.type as CampaignType;
      if (!TYPES.includes(type))
        throw new BadRequestException(`type must be one of: ${TYPES.join(', ')}`);
    }
    const start = body.startDate;
    const end = body.endDate;
    if ((!partial || start !== undefined || end !== undefined) && start && end && end < start)
      throw new BadRequestException('endDate must be on or after startDate');
  }

  async create(body: CampaignBody): Promise<Campaign> {
    this.validate(body);
    if (!body.startDate || !body.endDate)
      throw new BadRequestException('startDate and endDate are required');
    return this.campaigns.save(
      this.campaigns.create({
        title: body.title!.trim(),
        startDate: body.startDate,
        endDate: body.endDate,
        type: body.type as CampaignType,
        description: body.description?.trim() ?? '',
      }),
    );
  }

  async update(id: string, body: CampaignBody): Promise<Campaign> {
    const campaign = await this.campaigns.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    this.validate(body, true);
    if (body.title !== undefined) campaign.title = body.title.trim();
    if (body.startDate !== undefined) campaign.startDate = body.startDate;
    if (body.endDate !== undefined) campaign.endDate = body.endDate;
    if (body.type !== undefined) campaign.type = body.type as CampaignType;
    if (body.description !== undefined) campaign.description = body.description.trim();
    if (campaign.endDate < campaign.startDate)
      throw new BadRequestException('endDate must be on or after startDate');
    return this.campaigns.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const result = await this.campaigns.delete({ id });
    if (!result.affected) throw new NotFoundException(`Campaign ${id} not found`);
  }
}
