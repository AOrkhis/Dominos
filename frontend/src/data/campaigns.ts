export type CampaignType = 'national' | 'digital' | 'lsm' | 'fundraiser' | 'contest'

export interface Campaign {
  title: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  type: CampaignType
  description: string
}

export const campaignTypes: Record<CampaignType, { label: string; dot: string; chip: string }> = {
  national: { label: 'National Offer', dot: 'bg-brand-600', chip: 'bg-brand-100 text-brand-800' },
  digital: { label: 'Digital / Online', dot: 'bg-violet-500', chip: 'bg-violet-100 text-violet-800' },
  lsm: { label: 'Local Store Marketing', dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800' },
  fundraiser: { label: 'Fundraiser', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800' },
  contest: { label: 'Contest', dot: 'bg-accent-500', chip: 'bg-accent-100 text-accent-700' },
}

export const campaigns: Campaign[] = [
  {
    title: 'Cyber Week — 50% Off Menu Price (Online)',
    start: '2026-11-23',
    end: '2026-11-29',
    type: 'national',
    description:
      'National carryout & delivery deal. All stores participate — check that online pricing is live and window clings are posted.',
  },
  {
    title: 'S\'mores Lava Cakes — Digital Push',
    start: '2026-11-16',
    end: '2026-12-06',
    type: 'digital',
    description:
      'Paid social + app banners promoting the new S\'mores Lava Cakes. Pair with the upsell contest tracker.',
  },
  {
    title: 'Pizza Night Fundraiser — Schools Blitz',
    start: '2026-11-24',
    end: '2026-11-28',
    type: 'fundraiser',
    description:
      'Book 2+ school fundraiser nights this week. Kits with flyers and box toppers are on the materials page.',
  },
  {
    title: 'Box Topper — Winter Coupons Drop',
    start: '2026-12-01',
    end: '2026-12-15',
    type: 'lsm',
    description:
      'New box topper design with January bounce-back coupons. Order through the request form before Nov 27.',
  },
  {
    title: 'Holiday Gift Card Promo',
    start: '2026-12-08',
    end: '2026-12-24',
    type: 'national',
    description:
      'Buy $25 in gift cards, get a free 2-topping pizza coupon. Counter cards and drive-thru signage required.',
  },
  {
    title: 'Upsell Contest — Finals Week',
    start: '2026-12-26',
    end: '2026-12-31',
    type: 'contest',
    description:
      'Last push on the leaderboard. Remind staff at every shift huddle — top 10 sellers win Cineplex cards.',
  },
  {
    title: 'New Year Carryout Bundle',
    start: '2027-01-02',
    end: '2027-01-18',
    type: 'national',
    description:
      '$19.99 carryout bundle: 2 med 2-topping + bread side. Menuboard update required — request it early.',
  },
  {
    title: 'Winter Menu Board Refresh',
    start: '2027-01-05',
    end: '2027-01-09',
    type: 'lsm',
    description:
      'Swap summer LTO panels for winter lineup. Book the install window with your field marketing rep.',
  },
]
