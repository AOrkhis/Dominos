export type CampaignType = 'national' | 'digital' | 'lsm' | 'fundraiser' | 'contest'

/** Normalized shape the calendar renders — rows come from the API. */
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
