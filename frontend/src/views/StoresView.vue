<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import localStores, { getStoreStats, type Store } from '@/data/stores'
import { apiGet } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const { user } = useAuth()
const stores = ref<Store[]>(localStores)
const live = ref(false)
// Supervisors and users only see their assigned stores; everyone else sees all.
const scoped = computed(() => ['supervisor', 'user'].includes(user.value?.role ?? ''))

onMounted(async () => {
  try {
    const api = await apiGet<{ id: number; name: string; region: string }[]>(
      scoped.value ? '/stores/mine' : '/stores',
    )
    stores.value = api.map((s) => ({ id: s.id, city: s.name, region: s.region }))
    live.value = true
  } catch {
    // Scoped roles never fall back to the full bundled list.
    if (scoped.value) stores.value = []
  }
})

const query = ref('')
const region = ref('all')

const regions = computed(() => ['all', ...new Set(stores.value.map((s) => s.region))])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return stores.value.filter(
    (s) =>
      (region.value === 'all' || s.region === region.value) &&
      (!q || String(s.id).includes(q) || s.city.toLowerCase().includes(q)),
  )
})
</script>

<template>
  <PageHeader
    eyebrow="Performance"
    title="Store Report"
    description="Quick access to sales, orders and upsell performance for every store in the network. Pick yours."
  />

  <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-64 flex-1">
        <svg
          class="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="query"
          type="search"
          placeholder="Search by store number or city…"
          class="w-full rounded-full border border-slate-300 bg-white py-3 pr-4 pl-11 text-sm shadow-sm transition outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <select
        v-model="region"
        class="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition outline-none focus:border-brand-500"
      >
        <option v-for="r in regions" :key="r" :value="r">
          {{ r === 'all' ? 'All regions' : r }}
        </option>
      </select>
      <span
        :class="[
          'ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
          live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
        ]"
      >
        <span :class="['h-2 w-2 rounded-full', live ? 'bg-emerald-500' : 'bg-slate-400']" />
        {{ live ? 'Live — API' : 'Demo data' }}
      </span>
      <span
        v-if="scoped"
        class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700"
      >
        Your assigned stores
      </span>
    </div>

    <!-- Store grid -->
    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RouterLink
        v-for="store in filtered"
        :key="store.id"
        :to="`/stores/${store.id}`"
        class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-display text-2xl font-extrabold tracking-tight text-brand-800 transition group-hover:text-brand-600">
              {{ store.id }}
            </p>
            <p class="mt-0.5 text-sm font-medium text-slate-700">{{ store.city }}</p>
            <p class="text-xs text-slate-400">{{ store.region }}</p>
          </div>
          <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
            {{ getStoreStats(store.id).upsellRate }}% upsell
          </span>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>${{ getStoreStats(store.id).weeklySales.toLocaleString() }} / wk</span>
          <span class="inline-flex items-center gap-1 font-semibold text-brand-600">
            Report
            <svg class="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      </RouterLink>
    </div>

    <p v-if="!filtered.length" class="mt-12 text-center text-slate-500">
      No stores match « {{ query }} ».
    </p>
  </section>
</template>
