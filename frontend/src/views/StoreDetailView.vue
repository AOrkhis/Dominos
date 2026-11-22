<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { getStore, getStoreStats, getWeeklySeries } from '@/data/stores'

const route = useRoute()
const storeId = Number(route.params.id)
const store = getStore(storeId)
const stats = store ? getStoreStats(storeId) : null

const series = computed(() => (store ? getWeeklySeries(storeId) : []))
const maxSale = computed(() => Math.max(...series.value, 1))

const kpis = computed(() =>
  stats
    ? [
        { label: 'Weekly sales', value: `$${stats.weeklySales.toLocaleString()}`, trend: stats.salesTrend, good: 'up' },
        { label: 'Orders / week', value: stats.orders.toLocaleString(), trend: stats.ordersTrend, good: 'up' },
        { label: 'Avg. ticket', value: `$${stats.avgTicket.toFixed(2)}`, trend: null, good: 'up' },
        { label: 'Upsell rate', value: `${stats.upsellRate}%`, trend: null, good: 'up' },
        { label: 'Google rating', value: `${stats.rating} / 5`, trend: null, good: 'up' },
        { label: 'Upsell rank', value: `#${stats.rank} of 28`, trend: null, good: 'up' },
      ]
    : [],
)
</script>

<template>
  <template v-if="store && stats">
    <PageHeader
      :eyebrow="`Store Report — ${store.region}`"
      :title="`Store ${store.id}`"
      :description="`${store.city} · Weekly snapshot. Demo data — connect your reporting API for live numbers.`"
    >
      <RouterLink
        to="/stores"
        class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-200 transition hover:text-white"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M19 12H5m6 6-6-6 6-6" />
        </svg>
        All stores
      </RouterLink>
    </PageHeader>

    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <!-- KPI cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{{ kpi.label }}</p>
          <p class="font-display mt-2 text-2xl font-extrabold text-slate-900">{{ kpi.value }}</p>
          <p
            v-if="kpi.trend !== null"
            :class="[
              'mt-1 inline-flex items-center gap-1 text-xs font-bold',
              kpi.trend >= 0 ? 'text-emerald-600' : 'text-accent-500',
            ]"
          >
            <svg
              class="h-3.5 w-3.5"
              :class="kpi.trend < 0 && 'rotate-180'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <path d="M7 17 17 7m0 0H8m9 0v9" />
            </svg>
            {{ Math.abs(kpi.trend) }}% vs last week
          </p>
        </div>
      </div>

      <!-- Sales chart -->
      <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-display text-xl font-bold text-slate-900">Sales — last 8 weeks</h2>
          <span class="text-xs font-medium text-slate-400">Gross sales, demo data</span>
        </div>
        <div class="mt-8 flex h-56 items-end gap-3 sm:gap-5">
          <div
            v-for="(sale, i) in series"
            :key="i"
            class="group flex flex-1 flex-col items-center gap-2"
          >
            <span class="text-[10px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100">
              ${{ (sale / 1000).toFixed(1) }}k
            </span>
            <div
              :class="[
                'w-full rounded-t-lg transition group-hover:opacity-80',
                i === series.length - 1 ? 'bg-accent-500' : 'bg-brand-600',
              ]"
              :style="{ height: `${(sale / maxSale) * 100}%` }"
            />
            <span class="text-[10px] font-medium text-slate-400">
              {{ i === series.length - 1 ? 'Now' : `W-${series.length - 1 - i}` }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <RouterLink
          to="/request"
          class="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:shadow-lg"
        >
          <div>
            <h3 class="font-display font-bold text-slate-900">Order marketing materials</h3>
            <p class="mt-1 text-sm text-slate-600">Signage, coupons, box toppers for store {{ store.id }}.</p>
          </div>
          <svg class="h-5 w-5 text-brand-600 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </RouterLink>
        <RouterLink
          to="/contest"
          class="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:shadow-lg"
        >
          <div>
            <h3 class="font-display font-bold text-slate-900">Upsell contest standing</h3>
            <p class="mt-1 text-sm text-slate-600">Ranked #{{ stats.rank }} of 28 stores — see the leaderboard.</p>
          </div>
          <svg class="h-5 w-5 text-brand-600 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </RouterLink>
      </div>
    </section>
  </template>

  <section v-else class="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
    <h1 class="font-display text-4xl font-extrabold text-slate-900">Store not found</h1>
    <p class="mt-4 text-slate-600">Store {{ storeId }} isn't in the network. Double-check the number.</p>
    <RouterLink
      to="/stores"
      class="mt-8 inline-block rounded-full bg-brand-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
    >
      Back to Store Report
    </RouterLink>
  </section>
</template>
