<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import DominoLogo from '@/components/DominoLogo.vue'
import { apiGet, apiGetNullable } from '@/lib/api'

interface HomeContest {
  title: string
  startDate: string
  endDate: string
  intro: string
  teamPrize: string
  storePrize: string
  entries: {
    store: { id: number }
    manager: string
    upsellRate: string | number
  }[]
}

interface HomeCampaign {
  title: string
  startDate: string
  endDate: string
}

interface CompletedContest {
  title: string
  endDate: string
  winner1StoreId: number | null
  winner2StoreId: number | null
  winner3StoreId: number | null
}

const contest = ref<HomeContest | null>(null)
const contestLoading = ref(true)
const contestError = ref('')
const campaigns = ref<HomeCampaign[]>([])
const campaignsLoading = ref(true)
const campaignsError = ref('')
const lastContest = ref<CompletedContest | null>(null)
const lastContestLoading = ref(true)
const lastContestError = ref('')

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const today = dateKey(new Date())
const activeEvents = computed(() =>
  campaigns.value
    .filter((event) => event.startDate <= today && event.endDate >= today)
    .sort((a, b) => a.endDate.localeCompare(b.endDate)),
)
const upcomingEvents = computed(() =>
  campaigns.value
    .filter((event) => event.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate)),
)

const fmtContestDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  })

async function loadCurrentContest() {
  try {
    contest.value = await apiGetNullable<HomeContest>('/contest')
  } catch (e) {
    contestError.value = e instanceof Error ? e.message : 'Contest information is unavailable'
  } finally {
    contestLoading.value = false
  }
}

async function loadCalendarEvents() {
  try {
    campaigns.value = await apiGet<HomeCampaign[]>('/campaigns')
  } catch (e) {
    campaignsError.value = e instanceof Error ? e.message : 'Calendar information is unavailable'
  } finally {
    campaignsLoading.value = false
  }
}

async function loadLastContest() {
  try {
    lastContest.value = await apiGetNullable<CompletedContest>('/contest/winners/latest')
  } catch (e) {
    lastContestError.value = e instanceof Error ? e.message : 'Contest winners are unavailable'
  } finally {
    lastContestLoading.value = false
  }
}

onMounted(() => {
  void loadCurrentContest()
  void loadCalendarEvents()
  void loadLastContest()
})

const tickerItems = [
  'National Offers',
  'Coupons',
  'Fundraiser Programs',
  'Loyalty',
  'Print & Signage',
  'Social Media',
  'Upsell Contests',
  'Store Reports',
  'Local Marketing',
  'Uniforms & Cartops',
]

const sections = [
  {
    to: '/calendar',
    title: 'Marketing Calendar',
    text: 'Every national offer, digital push, fundraiser week and install window — planned ahead.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    accent: 'bg-brand-600',
  },
  {
    to: '/stores',
    title: 'Store Report',
    text: 'Quick access to your store\'s sales, orders and upsell performance. Pick your store number.',
    icon: 'M3 3v18h18M9 17V9m4 8v-5m4 5V6',
    accent: 'bg-violet-600',
  },
  {
    to: '/materials',
    title: 'Marketing Material',
    text: 'Posters, flags, box toppers, menus, coupon sheets — the full catalog, by category.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    accent: 'bg-amber-500',
  },
  {
    to: '/request',
    title: 'Marketing Requests',
    text: 'Need something created? Send a request and the team turns it around for your store.',
    icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    accent: 'bg-accent-500',
  },
  {
    to: '/contest',
    title: 'Upsell Contest',
    text: 'Live leaderboard, prizes and standings. See where your store ranks this month.',
    icon: 'M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4zm10 1h3a2 2 0 0 1-2 4h-1M7 5H4a2 2 0 0 0 2 4h1',
    accent: 'bg-gold-500',
  },
  {
    to: '/request',
    title: 'Talk to the Team',
    text: 'Social media, loyalty, print runs, community events — if you can dream it, we\'ll make it.',
    icon: 'M8 12h8m-8 4h5M21 12a9 9 0 1 1-4.5-7.8L21 3l-.8 4.2A8.96 8.96 0 0 1 21 12z',
    accent: 'bg-emerald-600',
  },
]

const steps = [
  {
    n: '01',
    title: 'Browse the catalog',
    text: 'Check the materials page for ideas — signage, upsell tools, LSM print, online campaigns.',
  },
  {
    n: '02',
    title: 'Send a request',
    text: 'One form, your store number, the items you need. Takes two minutes.',
  },
  {
    n: '03',
    title: 'We produce & ship',
    text: 'The marketing team designs, prints and ships straight to your store.',
  },
]
</script>

<template>
  <!-- Hero -->
  <section class="relative overflow-hidden bg-brand-950">
    <div
      class="absolute inset-0 opacity-[0.06]"
      :style="{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)',
        backgroundSize: '30px 30px',
      }"
    />
    <div class="absolute top-0 right-0 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
    <div class="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />

    <div class="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
      <div class="animate-fade-up">
        <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-200">
          <span class="h-2 w-2 rounded-full bg-accent-500" />
          DOMINO'S FRANCHISE MARKETING — QUÉBEC
        </div>
        <h1 class="font-display mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl">
          Everything your store needs to
          <span class="text-gold-400">sell more pizza.</span>
        </h1>
        <p class="mt-6 max-w-lg text-lg leading-relaxed text-brand-200">
          National offers, local campaigns, print materials, fundraisers, contests and store
          performance — one portal for the whole marketing team.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <RouterLink
            to="/materials"
            class="rounded-full bg-accent-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-500/30 transition hover:-translate-y-0.5 hover:bg-accent-600"
          >
            Browse Materials
          </RouterLink>
          <RouterLink
            to="/calendar"
            class="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Marketing Calendar
          </RouterLink>
        </div>
        <dl class="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
          <div>
            <dt class="text-xs font-medium tracking-wide text-brand-300 uppercase">Stores</dt>
            <dd class="font-display mt-1 text-3xl font-extrabold text-white">28</dd>
          </div>
          <div>
            <dt class="text-xs font-medium tracking-wide text-brand-300 uppercase">Campaigns</dt>
            <dd class="font-display mt-1 text-3xl font-extrabold text-white">8</dd>
          </div>
          <div>
            <dt class="text-xs font-medium tracking-wide text-brand-300 uppercase">Material SKUs</dt>
            <dd class="font-display mt-1 text-3xl font-extrabold text-white">20+</dd>
          </div>
        </dl>
      </div>

      <!-- Hero visual -->
      <div class="relative hidden lg:block">
        <div class="relative mx-auto aspect-square max-w-md">
          <DominoLogo class="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl" />

          <div class="absolute top-4 -left-4 max-w-64 animate-fade-up rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md" style="animation-delay: 0.15s">
            <p class="text-[10px] font-bold tracking-widest text-brand-200 uppercase">Upcoming events</p>
            <template v-if="!campaignsLoading && !campaignsError && upcomingEvents.length">
              <p
                v-for="event in upcomingEvents.slice(0, 2)"
                :key="event.title"
                class="font-display mt-1 truncate text-base font-extrabold text-white"
                :title="event.title"
              >
                {{ event.title }}
              </p>
              <p class="mt-1 text-xs text-brand-200">
                {{ fmtContestDate(upcomingEvents[0]!.startDate) }}
                <span v-if="upcomingEvents.length > 2"> · +{{ upcomingEvents.length - 2 }} more</span>
              </p>
            </template>
            <p v-else-if="campaignsLoading" class="mt-1 text-sm font-semibold text-white">Loading events…</p>
            <p v-else-if="campaignsError" class="mt-1 text-sm font-semibold text-white">Calendar unavailable</p>
            <p v-else class="mt-1 text-sm font-semibold text-white">No upcoming events</p>
          </div>

          <div class="absolute right-0 bottom-10 max-w-64 animate-fade-up rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md" style="animation-delay: 0.3s">
            <p class="text-[10px] font-bold tracking-widest text-brand-200 uppercase">This week</p>
            <template v-if="!campaignsLoading && !campaignsError && activeEvents.length">
              <p
                v-for="event in activeEvents.slice(0, 2)"
                :key="event.title"
                class="font-display mt-1 truncate text-base font-extrabold text-gold-400"
                :title="event.title"
              >
                {{ event.title }}
              </p>
              <p v-if="activeEvents.length > 2" class="mt-1 text-xs text-brand-200">
                +{{ activeEvents.length - 2 }} more active
              </p>
            </template>
            <p v-else-if="campaignsLoading" class="mt-1 text-sm text-brand-200">Loading events…</p>
            <p v-else-if="campaignsError" class="mt-1 text-sm text-brand-200">Calendar unavailable</p>
            <p v-else class="mt-1 text-sm font-semibold text-white">No active events</p>
          </div>

          <div class="absolute bottom-0 left-6 max-w-64 animate-fade-up rounded-2xl border border-white/10 bg-accent-500/90 p-4 shadow-xl backdrop-blur-md" style="animation-delay: 0.45s">
            <template v-if="lastContest">
              <p class="text-[10px] font-bold tracking-widest text-white/80 uppercase">Last contest winners</p>
              <p class="font-display mt-1 truncate text-sm font-extrabold text-white" :title="lastContest.title">
                {{ lastContest.title }}
              </p>
              <p
                v-for="winner in [
                  { place: '1st', storeId: lastContest.winner1StoreId },
                  { place: '2nd', storeId: lastContest.winner2StoreId },
                  { place: '3rd', storeId: lastContest.winner3StoreId },
                ]"
                :key="winner.place"
                class="mt-0.5 text-xs text-white/90"
              >
                {{ winner.place }} place: {{ winner.storeId ? `Store ${winner.storeId}` : 'Not selected' }}
              </p>
            </template>
            <p v-else-if="lastContestLoading" class="text-xs font-semibold text-white/90">Loading winners…</p>
            <p v-else-if="lastContestError" class="text-xs font-semibold text-white/90">Winners unavailable</p>
            <p v-else class="text-xs font-semibold text-white/90">No completed contest yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticker -->
    <div class="relative border-t border-white/10 bg-white/5 py-3.5">
      <div class="flex overflow-hidden">
        <div class="animate-ticker flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap">
          <span
            v-for="item in [...tickerItems, ...tickerItems]"
            :key="item + Math.random()"
            class="flex items-center gap-8 text-xs font-bold tracking-[0.2em] text-brand-200 uppercase"
          >
            {{ item }} <span class="text-accent-500">✦</span>
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- Sections grid -->
  <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
    <div class="max-w-2xl">
      <p class="text-xs font-bold tracking-[0.3em] text-accent-500 uppercase">Quick Access</p>
      <h2 class="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Jump straight to what you need
      </h2>
    </div>

    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="s in sections"
        :key="s.title"
        :to="s.to"
        class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
      >
        <div :class="['inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg', s.accent]">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="s.icon" />
          </svg>
        </div>
        <h3 class="font-display mt-4 text-lg font-bold text-slate-900 transition group-hover:text-brand-700">
          {{ s.title }}
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ s.text }}</p>
        <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
          Open
          <svg class="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </RouterLink>
    </div>
  </section>

  <!-- How it works -->
  <section class="border-y border-slate-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div class="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p class="text-xs font-bold tracking-[0.3em] text-accent-500 uppercase">How it works</p>
          <h2 class="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            From idea to in-store, in three steps
          </h2>
          <p class="mt-4 leading-relaxed text-slate-600">
            Need something created? See the marketing material page for ideas, then make a request —
            the team handles design, print and shipping.
          </p>
          <RouterLink
            to="/request"
            class="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700"
          >
            Make a Request
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </RouterLink>
        </div>
        <ol class="grid gap-4 sm:grid-cols-3">
          <li
            v-for="step in steps"
            :key="step.n"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-brand-300 hover:bg-brand-50"
          >
            <span class="font-display text-3xl font-extrabold text-brand-600/30">{{ step.n }}</span>
            <h3 class="font-display mt-3 font-bold text-slate-900">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </div>
  </section>

  <!-- Upcoming calendar events -->
  <section class="border-y border-slate-200 bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold tracking-[0.3em] text-accent-500 uppercase">Plan Ahead</p>
          <h2 class="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Upcoming Events
          </h2>
          <p class="mt-2 text-slate-600">The next three events on the marketing calendar.</p>
        </div>
        <RouterLink
          to="/calendar"
          class="inline-flex items-center gap-2 text-sm font-bold text-brand-600 transition hover:text-brand-800"
        >
          View full calendar
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </RouterLink>
      </div>

      <p v-if="campaignsLoading" class="mt-8 text-slate-500">Loading upcoming events…</p>
      <p v-else-if="campaignsError" class="mt-8 text-sm font-semibold text-accent-600">
        Upcoming events are unavailable: {{ campaignsError }}
      </p>
      <div v-else-if="upcomingEvents.length" class="mt-8 grid gap-4 md:grid-cols-3">
        <article
          v-for="(event, index) in upcomingEvents.slice(0, 3)"
          :key="`${event.title}-${event.startDate}`"
          class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p class="text-xs font-bold tracking-wider text-brand-600 uppercase">
            Event {{ index + 1 }}
          </p>
          <p class="mt-3 text-sm font-semibold text-slate-500">
            {{ fmtContestDate(event.startDate) }} – {{ fmtContestDate(event.endDate) }}
          </p>
          <h3 class="font-display mt-2 text-lg font-bold text-slate-900">{{ event.title }}</h3>
        </article>
      </div>
      <p v-else class="mt-8 text-slate-500">No upcoming events are scheduled.</p>
    </div>
  </section>

  <!-- Contest banner -->
  <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
    <RouterLink
      v-if="contest"
      to="/contest"
      class="group relative block overflow-hidden rounded-3xl bg-gradient-to-r from-accent-600 via-accent-500 to-rose-500 p-10 shadow-2xl shadow-accent-500/25 sm:p-14"
    >
      <div
        class="absolute inset-0 opacity-15"
        :style="{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)',
          backgroundSize: '26px 26px',
        }"
      />
      <div class="relative flex flex-wrap items-center justify-between gap-8">
        <div class="max-w-xl">
          <p class="text-xs font-bold tracking-[0.3em] text-white/80 uppercase">Live Contest</p>
          <h2 class="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            {{ contest.title }}
          </h2>
          <p class="mt-3 leading-relaxed text-white/85">{{ contest.intro }}</p>
          <p class="mt-3 text-sm font-semibold text-white/90">
            {{ fmtContestDate(contest.startDate) }} – {{ fmtContestDate(contest.endDate) }}
          </p>
          <div class="mt-4 flex flex-wrap gap-3 text-sm text-white/90">
            <span>Team prize: {{ contest.teamPrize }}</span>
            <span>Manager prize: {{ contest.storePrize }}</span>
          </div>
        </div>
        <span class="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-accent-600 shadow-lg transition group-hover:scale-105">
          View Leaderboard
          <svg class="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </RouterLink>
    <RouterLink
      v-else
      to="/contest"
      class="group block rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition hover:border-brand-300 hover:shadow-lg sm:p-14"
    >
      <p class="text-xs font-bold tracking-[0.3em] text-brand-500 uppercase">Upsell Contest</p>
      <h2 class="font-display mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
        {{ contestLoading ? 'Checking for a live contest…' : contestError ? 'Contest information unavailable' : 'No live contests right now' }}
      </h2>
      <p class="mt-3 text-slate-600">
        {{ contestError || 'Check back soon for the next event and leaderboard.' }}
      </p>
      <p
        v-if="!contestLoading && !contestError && !campaignsLoading && !campaignsError && upcomingEvents.length"
        class="mt-4 text-sm font-semibold text-brand-700"
      >
        Next calendar event: {{ upcomingEvents[0]!.title }} · {{ fmtContestDate(upcomingEvents[0]!.startDate) }}
      </p>
      <span class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-600">
        Visit contest page
        <svg class="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </span>
    </RouterLink>
  </section>
</template>
