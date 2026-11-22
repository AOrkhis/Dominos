<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DominoLogo from '@/components/DominoLogo.vue'
import { useAuth } from '@/lib/auth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Sign-in failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="relative flex min-h-[calc(100vh-6.25rem)] items-center justify-center overflow-hidden bg-brand-950 px-4 py-16">
    <div
      class="absolute inset-0 opacity-[0.06]"
      :style="{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)',
        backgroundSize: '30px 30px',
      }"
    />
    <div class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
    <div class="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />

    <div class="relative w-full max-w-md">
      <div class="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
        <div class="flex flex-col items-center">
          <DominoLogo class="h-14 w-14" />
          <h1 class="font-display mt-4 text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p class="mt-1 text-sm text-slate-500">Sign in to the marketing portal</p>
        </div>

        <form class="mt-8 space-y-5" @submit.prevent="submit">
          <div v-if="error" class="rounded-xl border border-accent-500/30 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
            {{ error }}
          </div>

          <div>
            <label for="email" class="text-sm font-bold text-slate-800">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@dominos.qc.ca"
              class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label for="password" class="text-sm font-bold text-slate-800">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-full bg-accent-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-500/25 transition hover:-translate-y-0.5 hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-slate-400">
          Franchise staff only — accounts are created by your administrator.
        </p>
      </div>
    </div>
  </section>
</template>
