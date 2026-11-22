import { CampaignType } from './campaign.entity.js';

export const CAMPAIGN_SEED: {
  title: string;
  startDate: string;
  endDate: string;
  type: CampaignType;
  description: string;
}[] = [
  {
    title: 'Cyber Week — 50% Off Menu Price (Online)',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    type: CampaignType.NATIONAL,
    description:
      'National carryout & delivery deal. All stores participate — check that online pricing is live and window clings are posted.',
  },
  {
    title: "S'mores Lava Cakes — Digital Push",
    startDate: '2026-11-16',
    endDate: '2026-12-06',
    type: CampaignType.DIGITAL,
    description:
      "Paid social + app banners promoting the new S'mores Lava Cakes. Pair with the upsell contest tracker.",
  },
  {
    title: 'Pizza Night Fundraiser — Schools Blitz',
    startDate: '2026-11-24',
    endDate: '2026-11-28',
    type: CampaignType.FUNDRAISER,
    description:
      'Book 2+ school fundraiser nights this week. Kits with flyers and box toppers are on the materials page.',
  },
  {
    title: 'Box Topper — Winter Coupons Drop',
    startDate: '2026-12-01',
    endDate: '2026-12-15',
    type: CampaignType.LSM,
    description:
      'New box topper design with January bounce-back coupons. Order through the request form before Nov 27.',
  },
  {
    title: 'Holiday Gift Card Promo',
    startDate: '2026-12-08',
    endDate: '2026-12-24',
    type: CampaignType.NATIONAL,
    description:
      'Buy $25 in gift cards, get a free 2-topping pizza coupon. Counter cards and drive-thru signage required.',
  },
  {
    title: 'Upsell Contest — Finals Week',
    startDate: '2026-12-26',
    endDate: '2026-12-31',
    type: CampaignType.CONTEST,
    description:
      'Last push on the leaderboard. Remind staff at every shift huddle — top 10 sellers win Cineplex cards.',
  },
  {
    title: 'New Year Carryout Bundle',
    startDate: '2027-01-02',
    endDate: '2027-01-18',
    type: CampaignType.NATIONAL,
    description:
      '$19.99 carryout bundle: 2 med 2-topping + bread side. Menuboard update required — request it early.',
  },
  {
    title: 'Winter Menu Board Refresh',
    startDate: '2027-01-05',
    endDate: '2027-01-09',
    type: CampaignType.LSM,
    description:
      'Swap summer LTO panels for winter lineup. Book the install window with your field marketing rep.',
  },
];
