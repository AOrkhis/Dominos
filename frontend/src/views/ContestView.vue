<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { apiGetNullable } from '@/lib/api'

interface ApiContest {
  title: string
  product: string
  startDate: string
  endDate: string
  intro: string
  teamPrize: string
  storePrize: string
  entries: {
    store: { id: number }
    manager: string
    upsellRate: string | number
    qualifyingOrders: number
    trend: 'up' | 'down' | 'same'
  }[]
}

const contest = ref<ApiContest | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    contest.value = await apiGetNullable<ApiContest>('/contest')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Contest information is unavailable'
  } finally {
    loading.value = false
  }
})

const now = new Date()
const daysUntil = (d: Date) => Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000))
const status = computed(() => {
  if (!contest.value) return null
  const start = new Date(`${contest.value.startDate}T00:00:00`)
  const end = new Date(`${contest.value.endDate}T23:59:59`)
  return now < start
    ? { label: 'Starts in', days: daysUntil(start), live: false }
    : now > end
      ? { label: 'Contest ended', days: 0, live: false }
      : { label: 'Days left', days: daysUntil(end), live: true }
})

const leaderboard = computed(() =>
  contest.value?.entries.map((entry) => ({
    storeId: entry.store.id,
    manager: entry.manager,
    upsellRate: Number(entry.upsellRate),
    qualifyingOrders: entry.qualifyingOrders,
    trend: entry.trend,
  })) ?? [],
)
const maxRate = computed(() => Math.max(1, ...leaderboard.value.map((e) => e.upsellRate)))

const medal = (i: number) =>
  ['bg-gold-400 text-white', 'bg-slate-300 text-slate-700', 'bg-amber-700 text-white'][i] ??
  'bg-slate-100 text-slate-500'

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })
</script>

<template>
  <PageHeader v-if="loading" eyebrow="Upsell Contest" title="Loading contest">
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-brand-200">Checking for a live event…</p>
  </PageHeader>
  <PageHeader v-else-if="error" eyebrow="Upsell Contest" title="Contest information unavailable">
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-brand-200">{{ error }}</p>
  </PageHeader>
  <PageHeader v-else-if="!contest" eyebrow="Upsell Contest" title="No live contests right now">
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-brand-200">
      Check back soon for the next event.
    </p>
  </PageHeader>
  <PageHeader
    v-else
    :eyebrow="`${fmtDate(contest.startDate)} – ${fmtDate(contest.endDate)}`"
    :title="contest.title"
  >
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-brand-200">{{ contest.intro }}</p>

    <div class="mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 backdrop-blur-sm">
      <span class="font-display text-4xl font-extrabold text-gold-400">{{ status?.days ?? 0 }}</span>
      <span class="text-sm font-semibold text-brand-100">
        {{ status?.label }}
        <span v-if="status?.live" class="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-400">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
        </span>
      </span>
    </div>
  </PageHeader>

  <!-- Prizes -->
  <section v-if="contest" class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <div class="grid gap-5 md:grid-cols-2">
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-8 text-white shadow-lg">
        <svg class="absolute -top-4 -right-4 h-32 w-32 opacity-20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4zm10 1h3a2 2 0 0 1-2 4h-1M7 5H4a2 2 0 0 0 2 4h1" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" />
        </svg>
        <p class="text-xs font-bold tracking-[0.25em] text-white/80 uppercase">Team Prize</p>
        <p class="font-display mt-3 max-w-sm text-2xl font-extrabold leading-snug">{{ contest.teamPrize }}</p>
      </div>
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-white shadow-lg">
        <p class="text-xs font-bold tracking-[0.25em] text-white/80 uppercase">Manager Prize</p>
        <p class="font-display mt-3 max-w-sm text-2xl font-extrabold leading-snug">{{ contest.storePrize }}</p>
      </div>
    </div>
  </section>

  <!-- Leaderboard -->
  <section v-if="contest" class="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
    <div class="flex items-end justify-between">
      <h2 class="font-display text-2xl font-extrabold text-slate-900">Leaderboard</h2>
      <p class="text-xs font-medium text-slate-400">Updated hourly · % of orders with {{ contest.product }}</p>
    </div>

    <div
      v-if="leaderboard.length"
      class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        v-for="(entry, i) in leaderboard"
        :key="entry.storeId"
        :class="[
          'flex items-center gap-4 px-5 py-4 sm:px-7',
          i !== leaderboard.length - 1 && 'border-b border-slate-100',
          i === 0 && 'bg-gold-400/10',
        ]"
      >
        <span
          :class="[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold',
            medal(i),
          ]"
        >
          {{ i + 1 }}
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <RouterLink
              :to="`/stores/${entry.storeId}`"
              class="font-display font-bold text-brand-800 hover:text-brand-600"
            >
              Store {{ entry.storeId }}
            </RouterLink>
            <span class="truncate text-xs text-slate-400">{{ entry.manager }}</span>
          </div>
          <div class="mt-1.5 h-2 max-w-md overflow-hidden rounded-full bg-slate-100">
            <div
              :class="['h-full rounded-full', i === 0 ? 'bg-gold-500' : 'bg-brand-600']"
              :style="{ width: `${(entry.upsellRate / maxRate) * 100}%` }"
            />
          </div>
        </div>
        <div class="text-right">
          <p class="font-display text-lg font-extrabold text-slate-900">{{ entry.upsellRate }}%</p>
          <p class="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-400">
            <svg
              v-if="entry.trend === 'up'"
              class="h-3 w-3 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            >
              <path d="M12 19V5m-6 6 6-6 6 6" />
            </svg>
            <svg
              v-else-if="entry.trend === 'down'"
              class="h-3 w-3 text-accent-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            >
              <path d="M12 5v14m6-6-6 6-6-6" />
            </svg>
            {{ entry.qualifyingOrders }} orders
          </p>
        </div>
      </div>
    </div>
    <div
      v-else
      class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500"
    >
      The leaderboard will appear when stores have qualifying results.
    </div>

    <!-- Rules -->
    <div class="mt-8 grid gap-5 sm:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <p class="font-display font-bold text-slate-900">How it counts</p>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          Every {{ contest.product }} sold counts toward your store's attach rate — tracked automatically at the till.
        </p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <p class="font-display font-bold text-slate-900">Minimum to qualify</p>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          Qualifying requirements are set for each contest event. Follow the current tracker and event rules announced for this contest.
        </p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <p class="font-display font-bold text-slate-900">Push it in-store</p>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          Order the contest kit — tracker poster, counter cards and huddle scripts — from the
          <RouterLink to="/materials" class="font-semibold text-brand-600 hover:underline">materials page</RouterLink>.
        </p>
      </div>
    </div>
  </section>
</template>
