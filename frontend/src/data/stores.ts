export interface Store {
  id: number
  city: string
  region: string
}

export interface StoreStats {
  weeklySales: number
  salesTrend: number
  orders: number
  ordersTrend: number
  avgTicket: number
  upsellRate: number
  rating: number
  rank: number
}

const stores: Store[] = [
  { id: 600, city: 'Saint-Catherine', region: 'Montréal' },
  { id: 649, city: 'Sainte-Thérèse', region: 'Laval / Rive-Nord' },
  { id: 650, city: 'Town of Mount Royal', region: 'Montréal' },
  { id: 651, city: 'Downtown', region: 'Montréal' },
  { id: 654, city: 'Côte-Saint-Luc Mall', region: 'Montréal' },
  { id: 657, city: 'Côte-Saint-Luc Décarie', region: 'Montréal' },
  { id: 659, city: 'Rachel', region: 'Montréal' },
  { id: 666, city: 'Saint-Rose', region: 'Laval / Rive-Nord' },
  { id: 671, city: 'Pierrefonds', region: 'West Island' },
  { id: 672, city: 'Pointe-Claire', region: 'West Island' },
  { id: 684, city: 'Dorval', region: 'West Island' },
  { id: 685, city: 'Laval — Samson', region: 'Laval / Rive-Nord' },
  { id: 687, city: 'LaSalle', region: 'Montréal' },
  { id: 690, city: 'Sources', region: 'West Island' },
  { id: 696, city: 'Old Montreal', region: 'Montréal' },
  { id: 697, city: 'Sherbrooke', region: 'Estrie' },
  { id: 700, city: 'Saint-Henri', region: 'Montréal' },
  { id: 704, city: 'Sherbrooke', region: 'Estrie' },
  { id: 707, city: 'Van Horne — Plamondon', region: 'Montréal' },
  { id: 710, city: 'Saint-Hubert', region: 'Rive-Sud' },
  { id: 714, city: 'Lacordaire', region: 'Montréal' },
  { id: 718, city: 'Papineau', region: 'Montréal' },
  { id: 720, city: 'Rivière-des-Prairies', region: 'Montréal' },
  { id: 724, city: 'Sherbrooke', region: 'Estrie' },
  { id: 725, city: 'Laval — Curé-Labelle', region: 'Laval / Rive-Nord' },
  { id: 727, city: 'Van Horne — Darlington', region: 'Montréal' },
  { id: 732, city: 'Châteauguay', region: 'Rive-Sud' },
  { id: 735, city: 'La Prairie', region: 'Rive-Sud' },
]

export default stores

export function getStore(id: number): Store | undefined {
  return stores.find((s) => s.id === id)
}

// Deterministic mock stats — replace with real API data later.
export function getStoreStats(id: number): StoreStats {
  const seeded = (salt: number) => {
    const x = Math.sin(id * 374761 + salt * 668265) * 10000
    return x - Math.floor(x)
  }
  const others = stores.filter((s) => s.id !== id)
  const rank = others.filter((s) => {
    const x = Math.sin(s.id * 374761 + 6 * 668265) * 10000
    return x - Math.floor(x) > seeded(6)
  }).length
  return {
    weeklySales: Math.round(14200 + seeded(1) * 22800),
    salesTrend: Math.round((seeded(2) * 18 - 6) * 10) / 10,
    orders: Math.round(620 + seeded(3) * 940),
    ordersTrend: Math.round((seeded(4) * 16 - 5) * 10) / 10,
    avgTicket: Math.round((21.5 + seeded(5) * 12) * 100) / 100,
    upsellRate: Math.round((4 + seeded(6) * 22) * 10) / 10,
    rating: Math.round((3.9 + seeded(7) * 1.1) * 10) / 10,
    rank: rank + 1,
  }
}

// Last 8 weeks of sales — deterministic mock series.
export function getWeeklySeries(id: number): number[] {
  return Array.from({ length: 8 }, (_, w) => {
    const x = Math.sin(id * 911 + w * 577) * 10000
    return Math.round(13000 + (x - Math.floor(x)) * 22000)
  })
}
