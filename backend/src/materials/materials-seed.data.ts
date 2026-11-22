import { MaterialCategory } from './material.entity.js';

export const MATERIAL_SEED: {
  name: string;
  detail: string;
  leadTime: string;
  category: MaterialCategory;
  sortOrder: number;
}[] = [
  // Upsell
  { name: 'Upsell Poster', detail: 'Counter + drive-thru poster, current LTO artwork', leadTime: '5 days', category: MaterialCategory.UPSELL, sortOrder: 0 },
  { name: 'Register Topper Cards', detail: 'Pack of 10 scripted prompts for dips & drinks', leadTime: '3 days', category: MaterialCategory.UPSELL, sortOrder: 1 },
  { name: 'Upsell Contest Kit', detail: 'Tracker poster + shift-huddle talking points', leadTime: '5 days', category: MaterialCategory.UPSELL, sortOrder: 2 },
  // Signage
  { name: 'Flag for Front of Store', detail: '12-ft feather flag, carryout or delivery message', leadTime: '7 days', category: MaterialCategory.SIGNAGE, sortOrder: 0 },
  { name: 'A-Frame', detail: 'Hardware only, double-sided sidewalk sign', leadTime: '7 days', category: MaterialCategory.SIGNAGE, sortOrder: 1 },
  { name: 'A-Frame Poster', detail: 'Replacement poster for your A-frame', leadTime: '4 days', category: MaterialCategory.SIGNAGE, sortOrder: 2 },
  { name: 'Window Cling', detail: 'Hours, Wi-Fi, or current national offer', leadTime: '5 days', category: MaterialCategory.SIGNAGE, sortOrder: 3 },
  { name: 'Open Hours Sign', detail: 'Updated hours decal for the entrance', leadTime: '4 days', category: MaterialCategory.SIGNAGE, sortOrder: 4 },
  // Online
  { name: 'Online Campaign', detail: 'Geo-targeted social + display around your store', leadTime: '10 days', category: MaterialCategory.ONLINE, sortOrder: 0 },
  { name: 'Google Business Refresh', detail: 'Photos, posts and offer updates on your listing', leadTime: '5 days', category: MaterialCategory.ONLINE, sortOrder: 1 },
  { name: 'Social Content Kit', detail: 'Localized posts for store Facebook/Instagram pages', leadTime: '5 days', category: MaterialCategory.ONLINE, sortOrder: 2 },
  // Visibility
  { name: 'More Cartops', detail: 'Additional cartop signs for new drivers', leadTime: '10 days', category: MaterialCategory.VISIBILITY, sortOrder: 0 },
  { name: 'Fix Broken Cartops', detail: 'Replacement magnets, straps or toppers', leadTime: '5 days', category: MaterialCategory.VISIBILITY, sortOrder: 1 },
  { name: 'Uniforms', detail: 'Shirts, hats and jackets — sizes on request form', leadTime: '10 days', category: MaterialCategory.VISIBILITY, sortOrder: 2 },
  // LSM
  { name: 'Coupon Sheet', detail: 'Store-specific coupon sheet, print-ready', leadTime: '7 days', category: MaterialCategory.LSM, sortOrder: 0 },
  { name: 'Flyers — Mailed to Customers', detail: 'Canada Post drop to your delivery zone', leadTime: '14 days', category: MaterialCategory.LSM, sortOrder: 1 },
  { name: 'Menus', detail: 'Updated menu cards for counter & insert', leadTime: '7 days', category: MaterialCategory.LSM, sortOrder: 2 },
  { name: 'Box Toppers', detail: 'Bounce-back offers glued to every box', leadTime: '7 days', category: MaterialCategory.LSM, sortOrder: 3 },
  { name: 'Menuboard Update', detail: 'New pricing / LTO panels installed', leadTime: '14 days', category: MaterialCategory.LSM, sortOrder: 4 },
  // In-Store
  { name: 'Pizza Night Fundraiser Kit', detail: 'Flyers, tickets and tracking sheet for schools', leadTime: '7 days', category: MaterialCategory.IN_STORE, sortOrder: 0 },
  { name: 'Community Event Kit', detail: 'Table cloth, banner, coupons and spin-wheel sign', leadTime: '10 days', category: MaterialCategory.IN_STORE, sortOrder: 1 },
  { name: 'Kids Activity Cards', detail: 'Colouring cards + free cookie offer', leadTime: '5 days', category: MaterialCategory.IN_STORE, sortOrder: 2 },
];
