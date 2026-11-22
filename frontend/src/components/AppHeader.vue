<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import DominoLogo from './DominoLogo.vue'
import { useAuth } from '@/lib/auth'

const open = ref(false)
const router = useRouter()
const { user, isLoggedIn, logout } = useAuth()

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  user: 'User',
}

const isAdmin = computed(() => ['admin', 'super_admin'].includes(user.value?.role ?? ''))

const onLogout = () => {
  logout()
  router.push('/')
}

const links = [
  { to: '/', label: 'Home' },
  { to: '/calendar', label: 'Marketing Calendar' },
  { to: '/stores', label: 'Store Report' },
  { to: '/materials', label: 'Marketing Material' },
  { to: '/request', label: 'Requests' },
  { to: '/contest', label: 'Upsell Contest' },
]
</script>

<template>
  <header class="sticky top-0 z-50">
    <!-- Utility bar -->
    <div class="bg-brand-950 text-brand-100">
      <div class="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs sm:px-6">
        <div class="flex items-center gap-4">
          <a href="tel:5148266217" class="flex items-center gap-1.5 transition hover:text-white">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            514-826-6217
          </a>
          <span class="hidden text-brand-300 sm:inline">|</span>
          <a href="mailto:mgagne@dominos.qc.ca" class="hidden transition hover:text-white sm:inline">
            mgagne@dominos.qc.ca
          </a>
        </div>
        <span class="font-medium tracking-wide text-brand-200 uppercase">Franchise Portal</span>
      </div>
    </div>

    <!-- Main nav -->
    <div class="border-b border-slate-200 bg-white/90 backdrop-blur-lg">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <RouterLink to="/" class="flex items-center gap-3">
          <DominoLogo class="h-9 w-9" />
          <div class="leading-none">
            <span class="font-display text-lg font-extrabold tracking-tight text-brand-900">
              SDGroup
            </span>
            <span class="mt-0.5 block text-[10px] font-semibold tracking-[0.28em] text-accent-500 uppercase">
              Marketing
            </span>
          </div>
        </RouterLink>

        <nav class="hidden items-center gap-1 lg:flex">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            active-class="!bg-brand-600 !text-white"
          >
            {{ link.label }}
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            to="/admin"
            class="rounded-full bg-brand-900 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
            active-class="!bg-accent-500"
          >
            Admin
          </RouterLink>
        </nav>

        <div class="flex items-center gap-3">
          <div v-if="isLoggedIn && user" class="hidden items-center gap-3 sm:flex">
            <div class="text-right leading-tight">
              <p class="text-sm font-bold text-slate-800">{{ user.name }}</p>
              <p class="text-[11px] font-semibold tracking-wide text-brand-600 uppercase">
                {{ roleLabels[user.role] ?? user.role }}
              </p>
            </div>
            <button
              class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent-500 hover:text-accent-600"
              @click="onLogout"
            >
              Log Out
            </button>
          </div>
          <RouterLink
            v-else
            to="/login"
            class="hidden rounded-full bg-accent-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600 sm:block"
          >
            Log In
          </RouterLink>
          <button
            class="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
            @click="open = !open"
          >
            <svg v-if="!open" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
            </svg>
            <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <nav v-if="open" class="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          active-class="!bg-brand-600 !text-white"
          @click="open = false"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink
          v-if="isAdmin"
          to="/admin"
          class="mt-2 block rounded-lg bg-brand-900 px-3 py-2.5 text-center text-sm font-bold text-white"
          @click="open = false"
        >
          Admin Dashboard
        </RouterLink>
        <RouterLink
          v-if="!isLoggedIn"
          to="/login"
          class="mt-2 block rounded-lg bg-accent-500 px-3 py-2.5 text-center text-sm font-bold text-white"
          @click="open = false"
        >
          Log In
        </RouterLink>
        <button
          v-else
          class="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm font-bold text-slate-600"
          @click="onLogout(); open = false"
        >
          Log Out ({{ user?.name }})
        </button>
      </nav>
    </div>
  </header>
</template>
