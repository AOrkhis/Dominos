<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DominoLogo from './DominoLogo.vue'

const links = [
  { to: '/calendar', label: 'Marketing Calendar' },
  { to: '/stores', label: 'Store Report' },
  { to: '/materials', label: 'Marketing Material' },
  { to: '/request', label: 'Marketing Requests' },
  { to: '/contest', label: 'Upsell Contest' },
]
</script>

<template>
  <footer class="mt-auto bg-brand-950 text-brand-200">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
      <div>
        <div class="flex items-center gap-3">
          <DominoLogo class="h-10 w-10" />
          <div class="leading-none">
            <span class="font-display text-xl font-extrabold tracking-tight text-white">SDGroup</span>
            <span class="mt-1 block text-[10px] font-semibold tracking-[0.28em] text-accent-500 uppercase">
              Marketing
            </span>
          </div>
        </div>
        <p class="mt-4 max-w-xs text-sm leading-relaxed text-brand-300">
          Everything your store needs to market smarter — national offers, local campaigns, print,
          digital and contests, in one place.
        </p>
      </div>

      <div>
        <h3 class="text-xs font-bold tracking-[0.2em] text-white uppercase">Quick Links</h3>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li v-for="link in links" :key="link.to">
            <RouterLink :to="link.to" class="transition hover:text-white">{{ link.label }}</RouterLink>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-xs font-bold tracking-[0.2em] text-white uppercase">Contact</h3>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li><a href="tel:5148266217" class="transition hover:text-white">514-826-6217</a></li>
          <li>
            <a href="mailto:mgagne@dominos.qc.ca" class="transition hover:text-white">
              mgagne@dominos.qc.ca
            </a>
          </li>
          <li class="pt-2 text-brand-300">Need something created? Browse the material catalog, then send a request.</li>
        </ul>
      </div>
    </div>

    <div class="border-t border-white/10">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-xs text-brand-300 sm:px-6">
        <span>© 2026 SDGroup Marketing. All rights reserved.</span>
        <span>Domino's Franchise Portal — Québec</span>
      </div>
    </div>
  </footer>
</template>
