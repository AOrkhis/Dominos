<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import stores from '@/data/stores'
import { materialCategories } from '@/data/materials'

const route = useRoute()

// Original form options, grouped for readability.
const options = [
  {
    group: 'Signage & Print',
    items: [
      'Upsell Poster',
      'Flag for the front of the store',
      'A-Frame',
      'A-Frame Poster',
      'Open Hours',
      'Window Cling',
      'Box Toppers',
      'Menus',
      'Coupon Sheet',
      'Flyers mailed to customers',
    ],
  },
  {
    group: 'Digital & Events',
    items: ['Online Campaign', 'Community Event', 'Pizza Night Fundraiser'],
  },
  {
    group: 'Store & Vehicle',
    items: ['Menuboard Update', 'Uniforms', 'More Cartops', 'Fix Broken Cartops'],
  },
]

const form = reactive({
  storeId: '',
  contact: '',
  neededBy: '',
  notes: '',
})

const selected = ref<Set<string>>(new Set())

// Pre-select when arriving from a catalog "Request this" link.
const preset = route.query.item
if (typeof preset === 'string') {
  const match = options
    .flatMap((g) => g.items)
    .find((i) => i.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(i.toLowerCase()))
  // Catalog names differ slightly; fall back to closest partial match.
  const loose = options
    .flatMap((g) => g.items)
    .find((i) => {
      const p = preset.toLowerCase().replace(/[^a-z ]/g, '')
      const n = i.toLowerCase().replace(/[^a-z ]/g, '')
      return p.includes(n.split(' ')[0] ?? '') || n.includes(p.split(' ')[0] ?? '')
    })
  if (match) selected.value.add(match)
  else if (loose) selected.value.add(loose)
}

const toggle = (item: string) => {
  selected.value.has(item) ? selected.value.delete(item) : selected.value.add(item)
  selected.value = new Set(selected.value)
}

const errors = ref<string[]>([])
const submitted = ref(false)

const canSubmit = computed(() => form.storeId && selected.value.size > 0)

const submit = () => {
  errors.value = []
  if (!form.storeId) errors.value.push('Choose your store number.')
  if (selected.value.size === 0) errors.value.push('Select at least one material.')
  if (errors.value.length) return
  submitted.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const storeLabel = computed(() => {
  const s = stores.find((x) => String(x.id) === form.storeId)
  return s ? `${s.id} — ${s.city}` : form.storeId
})
</script>

<template>
  <PageHeader
    eyebrow="Requests"
    title="Marketing Requests"
    description="Tell us what your store needs — posters, signage, coupons, uniforms, campaigns. The team turns requests around fast."
  />

  <!-- Success state -->
  <section v-if="submitted" class="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
      <svg class="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>
    <h2 class="font-display mt-6 text-3xl font-extrabold text-slate-900">Request sent!</h2>
    <p class="mt-3 text-slate-600">
      The marketing team will confirm by email or phone within 1–2 business days.
    </p>
    <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
      <p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Summary</p>
      <p class="mt-3 text-sm"><span class="font-semibold text-slate-700">Store:</span> {{ storeLabel }}</p>
      <p v-if="form.contact" class="mt-1 text-sm">
        <span class="font-semibold text-slate-700">Contact:</span> {{ form.contact }}
      </p>
      <p v-if="form.neededBy" class="mt-1 text-sm">
        <span class="font-semibold text-slate-700">Needed by:</span> {{ form.neededBy }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="item in [...selected]"
          :key="item"
          class="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"
        >
          {{ item }}
        </span>
      </div>
    </div>
    <button
      class="mt-8 rounded-full bg-brand-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
      @click="submitted = false"
    >
      Send another request
    </button>
  </section>

  <!-- Form -->
  <section v-else class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <form class="space-y-8" @submit.prevent="submit">
      <div v-if="errors.length" class="rounded-xl border border-accent-500/30 bg-accent-50 p-4">
        <p v-for="e in errors" :key="e" class="text-sm font-semibold text-accent-600">• {{ e }}</p>
      </div>

      <!-- Store + contact -->
      <div class="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
        <div>
          <label for="store" class="text-sm font-bold text-slate-800">
            Store # <span class="text-accent-500">*</span>
          </label>
          <select
            id="store"
            v-model="form.storeId"
            class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="" disabled>Select your store</option>
            <option v-for="s in stores" :key="s.id" :value="String(s.id)">
              {{ s.id }} — {{ s.city }}
            </option>
          </select>
        </div>
        <div>
          <label for="contact" class="text-sm font-bold text-slate-800">Your name / email</label>
          <input
            id="contact"
            v-model="form.contact"
            type="text"
            placeholder="e.g. Alex — alex@store600.ca"
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      <!-- Materials -->
      <fieldset class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <legend class="sr-only">What marketing material do you require?</legend>
        <h2 class="font-display text-lg font-bold text-slate-900">
          What do you require? <span class="text-accent-500">*</span>
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ selected.size }} selected — pick everything that applies.
        </p>

        <div v-for="group in options" :key="group.group" class="mt-6">
          <p class="text-xs font-bold tracking-[0.18em] text-slate-400 uppercase">{{ group.group }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="item in group.items"
              :key="item"
              type="button"
              :class="[
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                selected.has(item)
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700',
              ]"
              @click="toggle(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </fieldset>

      <!-- Details -->
      <div class="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
        <div>
          <label for="neededBy" class="text-sm font-bold text-slate-800">Needed by</label>
          <input
            id="neededBy"
            v-model="form.neededBy"
            type="date"
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="notes" class="text-sm font-bold text-slate-800">
            Quantities, sizes, details
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            placeholder="e.g. 500 box toppers, 2 flags, menuboard needs the winter LTO panels…"
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          :disabled="!canSubmit"
          class="rounded-full bg-accent-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-500/25 transition hover:-translate-y-0.5 hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Submit Request
        </button>
        <p class="text-xs text-slate-500">
          Typical turnaround is shown on each material — rush jobs? Call
          <a href="tel:5148266217" class="font-semibold text-brand-600">514-826-6217</a>.
        </p>
      </div>
    </form>
  </section>
</template>
