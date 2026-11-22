<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { materialCategories } from '@/data/materials'

const active = ref<string>('all')
</script>

<template>
  <PageHeader
    eyebrow="Catalog"
    title="Marketing Material"
    description="Everything the team can produce for your store — signage, upsell tools, local print, online campaigns and event kits."
  />

  <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <!-- Category filter -->
    <div class="flex flex-wrap gap-2">
      <button
        :class="[
          'rounded-full px-5 py-2 text-sm font-semibold transition',
          active === 'all'
            ? 'bg-brand-600 text-white shadow-md'
            : 'border border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-600',
        ]"
        @click="active = 'all'"
      >
        All
      </button>
      <button
        v-for="cat in materialCategories"
        :key="cat.slug"
        :class="[
          'rounded-full px-5 py-2 text-sm font-semibold transition',
          active === cat.slug
            ? 'bg-brand-600 text-white shadow-md'
            : 'border border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-600',
        ]"
        @click="active = cat.slug"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Categories -->
    <div class="mt-10 space-y-14">
      <section
        v-for="cat in materialCategories.filter((c) => active === 'all' || c.slug === active)"
        :key="cat.slug"
      >
        <div :class="['relative overflow-hidden rounded-2xl bg-gradient-to-r p-8 text-white sm:p-10', cat.gradient]">
          <div
            class="absolute inset-0 opacity-15"
            :style="{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)',
              backgroundSize: '24px 24px',
            }"
          />
          <div class="relative">
            <h2 class="font-display text-3xl font-extrabold tracking-tight">{{ cat.name }}</h2>
            <p class="mt-1 text-sm font-semibold tracking-wide text-white/80 uppercase">{{ cat.tagline }}</p>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">{{ cat.description }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="item in cat.items"
            :key="item.name"
            class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-display font-bold text-slate-900">{{ item.name }}</h3>
              <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                ~{{ item.leadTime }}
              </span>
            </div>
            <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{{ item.detail }}</p>
            <RouterLink
              :to="{ path: '/request', query: { item: item.name } }"
              class="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition group-hover:text-brand-700"
            >
              Request this
              <svg class="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </RouterLink>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
