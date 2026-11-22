<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description?: string
}>()
</script>

<template>
  <section class="relative overflow-hidden bg-brand-950">
    <div
      class="absolute inset-0 opacity-[0.07]"
      :style="{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)',
        backgroundSize: '28px 28px',
      }"
    />
    <div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
    <div class="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />

    <div class="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
      <p class="text-xs font-bold tracking-[0.3em] text-accent-500 uppercase">{{ eyebrow }}</p>
      <h1 class="font-display mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-4 max-w-2xl text-base leading-relaxed text-brand-200">
        {{ description }}
      </p>
      <slot />
    </div>
  </section>
</template>
