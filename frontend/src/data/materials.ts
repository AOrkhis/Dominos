export interface MaterialCategory {
  slug: string
  name: string
  tagline: string
  description: string
  gradient: string
  items: MaterialItem[]
}

export interface MaterialItem {
  name: string
  detail: string
  leadTime: string
}

export const materialCategories: MaterialCategory[] = [
  {
    slug: 'upsell',
    name: 'Upsell',
    tagline: 'Grow the ticket at the counter',
    description:
      'Counter cards, register toppers and staff prompts that push dips, drinks and desserts at the point of sale.',
    gradient: 'from-accent-500 to-rose-700',
    items: [
      { name: 'Upsell Poster', detail: 'Counter + drive-thru poster, current LTO artwork', leadTime: '5 days' },
      { name: 'Register Topper Cards', detail: 'Pack of 10 scripted prompts for dips & drinks', leadTime: '3 days' },
      { name: 'Upsell Contest Kit', detail: 'Tracker poster + shift-huddle talking points', leadTime: '5 days' },
    ],
  },
  {
    slug: 'signage',
    name: 'Signage',
    tagline: 'Get seen from the street',
    description:
      'Flags, A-frames, window clings and banners that turn drive-by traffic into carryout orders.',
    gradient: 'from-brand-600 to-brand-800',
    items: [
      { name: 'Flag for Front of Store', detail: '12-ft feather flag, carryout or delivery message', leadTime: '7 days' },
      { name: 'A-Frame', detail: 'Hardware only, double-sided sidewalk sign', leadTime: '7 days' },
      { name: 'A-Frame Poster', detail: 'Replacement poster for your A-frame', leadTime: '4 days' },
      { name: 'Window Cling', detail: 'Hours, Wi-Fi, or current national offer', leadTime: '5 days' },
      { name: 'Open Hours Sign', detail: 'Updated hours decal for the entrance', leadTime: '4 days' },
    ],
  },
  {
    slug: 'online',
    name: 'Online',
    tagline: 'Win the feed, win the order',
    description:
      'Digital campaigns, social kits and Google Business content managed by the marketing team.',
    gradient: 'from-violet-500 to-violet-800',
    items: [
      { name: 'Online Campaign', detail: 'Geo-targeted social + display around your store', leadTime: '10 days' },
      { name: 'Google Business Refresh', detail: 'Photos, posts and offer updates on your listing', leadTime: '5 days' },
      { name: 'Social Content Kit', detail: 'Localized posts for store Facebook/Instagram pages', leadTime: '5 days' },
    ],
  },
  {
    slug: 'visibility',
    name: 'Visibility',
    tagline: 'Own your delivery zone',
    description:
      'Cartops, uniforms and vehicle branding that keep your drivers visible on every run.',
    gradient: 'from-amber-500 to-orange-700',
    items: [
      { name: 'More Cartops', detail: 'Additional cartop signs for new drivers', leadTime: '10 days' },
      { name: 'Fix Broken Cartops', detail: 'Replacement magnets, straps or toppers', leadTime: '5 days' },
      { name: 'Uniforms', detail: 'Shirts, hats and jackets — sizes on request form', leadTime: '10 days' },
    ],
  },
  {
    slug: 'lsm',
    name: 'LSM',
    tagline: 'Local store marketing toolkit',
    description:
      'Coupons, flyers, menus and door-hangers to blanket your delivery zone.',
    gradient: 'from-emerald-500 to-emerald-800',
    items: [
      { name: 'Coupon Sheet', detail: 'Store-specific coupon sheet, print-ready', leadTime: '7 days' },
      { name: 'Flyers — Mailed to Customers', detail: 'Canada Post drop to your delivery zone', leadTime: '14 days' },
      { name: 'Menus', detail: 'Updated menu cards for counter & insert', leadTime: '7 days' },
      { name: 'Box Toppers', detail: 'Bounce-back offers glued to every box', leadTime: '7 days' },
      { name: 'Menuboard Update', detail: 'New pricing / LTO panels installed', leadTime: '14 days' },
    ],
  },
  {
    slug: 'in-store',
    name: 'In-Store',
    tagline: 'Events that fill the lobby',
    description:
      'Fundraiser kits and community event materials that bring the neighbourhood in.',
    gradient: 'from-sky-500 to-sky-800',
    items: [
      { name: 'Pizza Night Fundraiser Kit', detail: 'Flyers, tickets and tracking sheet for schools', leadTime: '7 days' },
      { name: 'Community Event Kit', detail: 'Table cloth, banner, coupons and spin-wheel sign', leadTime: '10 days' },
      { name: 'Kids Activity Cards', detail: 'Colouring cards + free cookie offer', leadTime: '5 days' },
    ],
  },
]
