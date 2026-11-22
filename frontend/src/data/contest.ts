export interface ContestEntry {
  storeId: number
  manager: string
  upsellRate: number // % of orders including the item
  qualifyingOrders: number
  trend: 'up' | 'down' | 'same'
}

export const contest = {
  title: "S'more Lava, S'more Cakes!",
  product: "S'mores Lava Cakes",
  start: '2026-12-01',
  end: '2026-12-31',
  intro:
    "We're inviting all participating stores to compete for the sweetest crown. Help our guests discover the magic of gooey marshmallow and rich chocolate — and watch your store climb to the top of the tracker.",
  teamPrize: 'The 10 team members who sell the most as a % (minimum 20 orders) each earn a $50 Cineplex gift card.',
  storePrize: 'The manager of the top % store takes home $250.',
}

export const leaderboard: ContestEntry[] = [
  { storeId: 10654, manager: 'S. Tremblay', upsellRate: 24.6, qualifyingOrders: 212, trend: 'up' },
  { storeId: 10700, manager: 'M. Gagnon', upsellRate: 22.8, qualifyingOrders: 187, trend: 'up' },
  { storeId: 10600, manager: 'J. Roy', upsellRate: 21.4, qualifyingOrders: 245, trend: 'same' },
  { storeId: 10671, manager: 'A. Bouchard', upsellRate: 19.9, qualifyingOrders: 164, trend: 'up' },
  { storeId: 10724, manager: 'C. Côté', upsellRate: 18.7, qualifyingOrders: 198, trend: 'down' },
  { storeId: 10649, manager: 'L. Fortin', upsellRate: 17.3, qualifyingOrders: 176, trend: 'same' },
  { storeId: 10666, manager: 'P. Ouellet', upsellRate: 16.1, qualifyingOrders: 143, trend: 'up' },
  { storeId: 10735, manager: 'V. Girard', upsellRate: 15.4, qualifyingOrders: 121, trend: 'down' },
  { storeId: 10690, manager: 'N. Bergeron', upsellRate: 14.2, qualifyingOrders: 156, trend: 'same' },
  { storeId: 10657, manager: 'E. Lauzon', upsellRate: 12.8, qualifyingOrders: 134, trend: 'up' },
]
