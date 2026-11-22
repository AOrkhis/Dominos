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
  { id: 10600, city: 'Montréal — Centre-Ville', region: 'Montréal' },
  { id: 10649, city: 'Laval', region: 'Laval / Rive-Nord' },
  { id: 10650, city: 'Longueuil', region: 'Rive-Sud' },
  { id: 10651, city: 'Brossard', region: 'Rive-Sud' },
  { id: 10654, city: 'Montréal — Plateau', region: 'Montréal' },
  { id: 10657, city: 'Gatineau', region: 'Outaouais' },
  { id: 10659, city: 'Sherbrooke', region: 'Estrie' },
  { id: 10666, city: 'Trois-Rivières', region: 'Mauricie' },
  { id: 10671, city: 'Saint-Jérôme', region: 'Laurentides' },
  { id: 10672, city: 'Repentigny', region: 'Lanaudière' },
  { id: 10684, city: 'Terrebonne', region: 'Lanaudière' },
  { id: 10685, city: 'Drummondville', region: 'Centre-du-Québec' },
  { id: 10687, city: 'Granby', region: 'Montérégie' },
  { id: 10690, city: 'Saint-Hyacinthe', region: 'Montérégie' },
  { id: 10696, city: 'Joliette', region: 'Lanaudière' },
  { id: 10697, city: 'Vaudreuil-Dorion', region: 'Montérégie' },
  { id: 10700, city: 'Blainville', region: 'Laurentides' },
  { id: 10704, city: 'Chambly', region: 'Montérégie' },
  { id: 10707, city: 'Mascouche', region: 'Lanaudière' },
  { id: 10710, city: 'Sainte-Thérèse', region: 'Laurentides' },
  { id: 10714, city: 'Mirabel', region: 'Laurentides' },
  { id: 10718, city: 'Sorel-Tracy', region: 'Montérégie' },
  { id: 10720, city: 'Victoriaville', region: 'Centre-du-Québec' },
  { id: 10724, city: 'Québec — Sainte-Foy', region: 'Capitale-Nationale' },
  { id: 10725, city: 'Québec — Charlesbourg', region: 'Capitale-Nationale' },
  { id: 10727, city: 'Lévis', region: 'Chaudière-Appalaches' },
  { id: 10732, city: 'Rimouski', region: 'Bas-Saint-Laurent' },
  { id: 10735, city: 'Chicoutimi', region: 'Saguenay' },
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
