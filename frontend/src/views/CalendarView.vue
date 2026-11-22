<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import {
  campaigns as localCampaigns,
  campaignTypes,
  type Campaign,
  type CampaignType,
} from '@/data/campaigns'
import { apiGet } from '@/lib/api'

interface ApiCampaign {
  title: string
  startDate: string
  endDate: string
  type: CampaignType
  description: string
}

const campaigns = ref<Campaign[]>(localCampaigns)

onMounted(async () => {
  try {
    const api = await apiGet<ApiCampaign[]>('/campaigns')
    campaigns.value = api.map((c) => ({
      title: c.title,
      start: c.startDate,
      end: c.endDate,
      type: c.type,
      description: c.description,
    }))
  } catch {
    // API offline — bundled data stays
  }
})

const monthOptions = [
  { year: 2026, month: 10 }, // November
  { year: 2026, month: 11 }, // December
  { year: 2027, month: 0 }, // January
]
const monthIndex = ref(1)

const monthName = computed(() =>
  new Date(monthOptions[monthIndex.value]!.year, monthOptions[monthIndex.value]!.month).toLocaleString(
    'en-CA',
    { month: 'long', year: 'numeric' },
  ),
)

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

interface Cell {
  date: Date
  inMonth: boolean
  isToday: boolean
  campaigns: Campaign[]
}

const today = toKey(new Date())

const cells = computed<Cell[]>(() => {
  const { year, month } = monthOptions[monthIndex.value]!
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday-first grid
  const start = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const key = toKey(date)
    return {
      date,
      inMonth: date.getMonth() === month,
      isToday: key === today,
      campaigns: campaigns.value.filter((c) => c.start <= key && c.end >= key),
    }
  })
})

const monthCampaigns = computed(() => {
  const { year, month } = monthOptions[monthIndex.value]!
  const first = toKey(new Date(year, month, 1))
  const last = toKey(new Date(year, month + 1, 0))
  return campaigns.value.filter((c) => c.start <= last && c.end >= first)
})

const fmtRange = (c: Campaign) => {
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  return `${fmt(c.start)} – ${fmt(c.end)}`
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
</script>

<template>
  <PageHeader
    eyebrow="Plan Ahead"
    title="Marketing Calendar"
    description="Every national offer, digital push, fundraiser week and install window — so your store is never caught off guard."
  />

  <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <!-- Month nav + legend -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          class="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-30"
          :disabled="monthIndex === 0"
          aria-label="Previous month"
          @click="monthIndex--"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 class="font-display w-44 text-center text-xl font-bold text-slate-900">{{ monthName }}</h2>
        <button
          class="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-30"
          :disabled="monthIndex === monthOptions.length - 1"
          aria-label="Next month"
          @click="monthIndex++"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div class="flex flex-wrap gap-3">
        <span
          v-for="(meta, type) in campaignTypes"
          :key="type"
          class="flex items-center gap-1.5 text-xs font-medium text-slate-600"
        >
          <span :class="['h-2.5 w-2.5 rounded-full', meta.dot]" />
          {{ meta.label }}
        </span>
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        <div
          v-for="d in weekDays"
          :key="d"
          class="px-2 py-2.5 text-center text-xs font-bold tracking-wider text-slate-500 uppercase"
        >
          {{ d }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="cell in cells"
          :key="cell.date.toISOString()"
          :class="[
            'min-h-20 border-b border-r border-slate-100 p-1.5 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0',
            cell.inMonth ? 'bg-white' : 'bg-slate-50/60',
          ]"
        >
          <span
            :class="[
              'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
              cell.isToday ? 'bg-accent-500 text-white' : cell.inMonth ? 'text-slate-700' : 'text-slate-400',
            ]"
          >
            {{ cell.date.getDate() }}
          </span>
          <div class="mt-1 hidden space-y-1 sm:block">
            <div
              v-for="c in cell.campaigns.slice(0, 2)"
              :key="c.title"
              :class="['truncate rounded px-1.5 py-0.5 text-[10px] font-semibold', campaignTypes[c.type].chip]"
              :title="c.title"
            >
              {{ c.title }}
            </div>
            <div v-if="cell.campaigns.length > 2" class="px-1 text-[10px] font-medium text-slate-400">
              +{{ cell.campaigns.length - 2 }} more
            </div>
          </div>
          <div class="mt-1 flex flex-wrap gap-1 sm:hidden">
            <span
              v-for="c in cell.campaigns"
              :key="c.title"
              :class="['h-1.5 w-1.5 rounded-full', campaignTypes[c.type].dot]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Campaign details -->
    <h3 class="font-display mt-12 text-2xl font-bold text-slate-900">
      Campaigns in {{ monthName }}
    </h3>
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <article
        v-for="c in monthCampaigns"
        :key="c.title"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-4">
          <span :class="['rounded-full px-3 py-1 text-xs font-bold', campaignTypes[c.type].chip]">
            {{ campaignTypes[c.type].label }}
          </span>
          <span class="text-xs font-semibold whitespace-nowrap text-slate-500">{{ fmtRange(c) }}</span>
        </div>
        <h4 class="font-display mt-3 text-lg font-bold text-slate-900">{{ c.title }}</h4>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ c.description }}</p>
      </article>
      <p v-if="!monthCampaigns.length" class="text-slate-500">No campaigns scheduled this month.</p>
    </div>
  </section>
</template>
