<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAuth } from '@/lib/auth'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api'
import { campaignTypes, type CampaignType } from '@/data/campaigns'
import { materialCategories } from '@/data/materials'

const { user } = useAuth()

// ---------- types matching the API ----------
interface ApiStore { id: number; name: string; region: string }
interface ApiAssignment { id: string; store: ApiStore }
interface ApiUser {
  id: string; name: string; email: string
  role: 'super_admin' | 'admin' | 'supervisor' | 'user'
  isActive: boolean; assignments: ApiAssignment[]
}
interface ApiRequest {
  id: string; store: ApiStore; contact: string | null
  neededBy: string | null; items: string[]; notes: string | null
  status: 'new' | 'in_progress' | 'done'; createdAt: string
}
interface ApiCampaign {
  id: string; title: string; startDate: string; endDate: string
  type: CampaignType; description: string
}
interface ApiMaterial {
  id: string; name: string; detail: string; leadTime: string
  category: string; isActive: boolean
}
interface ApiEntry {
  id: string; store: ApiStore; manager: string
  upsellRate: string | number; qualifyingOrders: number
  trend: 'up' | 'down' | 'same'
}
interface ApiContest {
  id: string; title: string; product: string
  startDate: string; endDate: string; intro: string
  teamPrize: string; storePrize: string; entries: ApiEntry[]
}

// ---------- shared state ----------
type Tab = 'people' | 'requests' | 'calendar' | 'materials' | 'contest'
const tab = ref<Tab>('people')
const tabs: { id: Tab; label: string }[] = [
  { id: 'people', label: 'People & Stores' },
  { id: 'requests', label: 'Requests Inbox' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'materials', label: 'Materials' },
  { id: 'contest', label: 'Contest' },
]

const loading = ref(true)
const error = ref('')
const toast = ref('')
const flash = (msg: string) => {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2500)
}
const fail = (e: unknown) => {
  error.value = e instanceof Error ? e.message : 'Something went wrong'
}

const stores = ref<ApiStore[]>([])
const users = ref<ApiUser[]>([])
const requests = ref<ApiRequest[]>([])
const campaigns = ref<ApiCampaign[]>([])
const materials = ref<ApiMaterial[]>([])
const contest = ref<ApiContest | null>(null)

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  user: 'User',
}
const roles = ['user', 'supervisor', 'admin', 'super_admin'] as const
const requestStatuses = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [s, u, r, c, m, ct] = await Promise.all([
      apiGet<ApiStore[]>('/stores'),
      apiGet<ApiUser[]>('/users'),
      apiGet<ApiRequest[]>('/requests'),
      apiGet<ApiCampaign[]>('/campaigns'),
      apiGet<ApiMaterial[]>('/materials/all'),
      apiGet<ApiContest>('/contest'),
    ])
    stores.value = s
    users.value = u
    requests.value = r
    campaigns.value = c
    materials.value = m
    contest.value = ct
  } catch (e) {
    fail(e)
  } finally {
    loading.value = false
  }
}
onMounted(loadAll)

// ---------- people ----------
const newUser = reactive({ name: '', email: '', password: '', role: 'user' as string })
const busy = ref(false)

async function createUser() {
  busy.value = true
  error.value = ''
  try {
    const created = await apiPost<ApiUser>('/users', newUser)
    users.value.push(created)
    Object.assign(newUser, { name: '', email: '', password: '', role: 'user' })
    flash('User created')
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}

async function setRole(u: ApiUser, role: string) {
  try {
    const updated = await apiPatch<ApiUser>(`/users/${u.id}`, { role })
    Object.assign(u, updated)
    flash(`Role → ${roleLabels[role]}`)
  } catch (e) {
    fail(e)
  }
}

async function toggleActive(u: ApiUser) {
  try {
    const updated = await apiPatch<ApiUser>(`/users/${u.id}`, { isActive: !u.isActive })
    Object.assign(u, updated)
    flash(updated.isActive ? 'Account activated' : 'Account deactivated')
  } catch (e) {
    fail(e)
  }
}

async function removeUser(u: ApiUser) {
  if (!confirm(`Delete ${u.name} (${u.email})?`)) return
  try {
    await apiDelete(`/users/${u.id}`)
    users.value = users.value.filter((x) => x.id !== u.id)
    flash('User deleted')
  } catch (e) {
    fail(e)
  }
}

const assignPick = reactive<Record<string, number | ''>>({})

async function assign(u: ApiUser) {
  const storeId = assignPick[u.id]
  if (!storeId) return
  try {
    const a = await apiPost<{ id: string; store: ApiStore }>('/assignments', {
      userId: u.id,
      storeId,
    })
    u.assignments.push({ id: a.id, store: a.store })
    assignPick[u.id] = ''
    flash(`Store ${storeId} assigned`)
  } catch (e) {
    fail(e)
  }
}

async function unassign(u: ApiUser, a: ApiAssignment) {
  try {
    await apiDelete(`/assignments/${a.id}`)
    u.assignments = u.assignments.filter((x) => x.id !== a.id)
    flash('Assignment removed')
  } catch (e) {
    fail(e)
  }
}

const assignable = (u: ApiUser) =>
  stores.value.filter((s) => !u.assignments.some((a) => a.store.id === s.id))

// ---------- requests ----------
async function setRequestStatus(r: ApiRequest, status: string) {
  try {
    const updated = await apiPatch<ApiRequest>(`/requests/${r.id}`, { status })
    Object.assign(r, updated)
    flash('Status updated')
  } catch (e) {
    fail(e)
  }
}

async function removeRequest(r: ApiRequest) {
  try {
    await apiDelete(`/requests/${r.id}`)
    requests.value = requests.value.filter((x) => x.id !== r.id)
  } catch (e) {
    fail(e)
  }
}

const openRequests = computed(() => requests.value.filter((r) => r.status !== 'done'))
const doneRequests = computed(() => requests.value.filter((r) => r.status === 'done'))

// ---------- calendar ----------
const blankCampaign = () => ({
  id: '' as string | '',
  title: '',
  startDate: '',
  endDate: '',
  type: 'national' as CampaignType,
  description: '',
})
const campaignForm = reactive(blankCampaign())
const campaignEditing = computed(() => campaignForm.id !== '')

function editCampaign(c: ApiCampaign) {
  Object.assign(campaignForm, { ...c })
}
async function saveCampaign() {
  error.value = ''
  try {
    if (campaignEditing.value) {
      const updated = await apiPatch<ApiCampaign>(`/campaigns/${campaignForm.id}`, campaignForm)
      const i = campaigns.value.findIndex((c) => c.id === updated.id)
      if (i >= 0) campaigns.value[i] = updated
      flash('Campaign updated')
    } else {
      const { id: _id, ...body } = campaignForm
      campaigns.value.push(await apiPost<ApiCampaign>('/campaigns', body))
      flash('Campaign added')
    }
    Object.assign(campaignForm, blankCampaign())
  } catch (e) {
    fail(e)
  }
}
async function removeCampaign(c: ApiCampaign) {
  if (!confirm(`Delete "${c.title}"?`)) return
  try {
    await apiDelete(`/campaigns/${c.id}`)
    campaigns.value = campaigns.value.filter((x) => x.id !== c.id)
  } catch (e) {
    fail(e)
  }
}

// ---------- materials ----------
const blankMaterial = () => ({
  id: '',
  name: '',
  detail: '',
  leadTime: '7 days',
  category: 'signage',
})
const materialForm = reactive(blankMaterial())

function editMaterial(m: ApiMaterial) {
  Object.assign(materialForm, {
    id: m.id, name: m.name, detail: m.detail, leadTime: m.leadTime, category: m.category,
  })
}
async function saveMaterial() {
  error.value = ''
  try {
    if (materialForm.id) {
      const updated = await apiPatch<ApiMaterial>(`/materials/${materialForm.id}`, materialForm)
      const i = materials.value.findIndex((m) => m.id === updated.id)
      if (i >= 0) materials.value[i] = updated
      flash('Material updated')
    } else {
      const { id: _id, ...body } = materialForm
      materials.value.push(await apiPost<ApiMaterial>('/materials', body))
      flash('Material added')
    }
    Object.assign(materialForm, blankMaterial())
  } catch (e) {
    fail(e)
  }
}
async function toggleMaterial(m: ApiMaterial) {
  try {
    const updated = await apiPatch<ApiMaterial>(`/materials/${m.id}`, { isActive: !m.isActive })
    Object.assign(m, updated)
  } catch (e) {
    fail(e)
  }
}
async function removeMaterial(m: ApiMaterial) {
  if (!confirm(`Delete "${m.name}"?`)) return
  try {
    await apiDelete(`/materials/${m.id}`)
    materials.value = materials.value.filter((x) => x.id !== m.id)
  } catch (e) {
    fail(e)
  }
}

// ---------- contest ----------
const entryForm = reactive({
  id: '', storeId: '' as number | '', manager: '',
  upsellRate: '' as number | '', qualifyingOrders: '' as number | '',
  trend: 'same' as 'up' | 'down' | 'same',
})

function editEntry(e: ApiEntry) {
  Object.assign(entryForm, {
    id: e.id, storeId: e.store.id, manager: e.manager,
    upsellRate: Number(e.upsellRate), qualifyingOrders: e.qualifyingOrders, trend: e.trend,
  })
}
async function saveEntry() {
  error.value = ''
  try {
    if (entryForm.id) {
      const updated = await apiPatch<ApiEntry>(`/contest/entries/${entryForm.id}`, {
        manager: entryForm.manager,
        upsellRate: Number(entryForm.upsellRate),
        qualifyingOrders: Number(entryForm.qualifyingOrders),
        trend: entryForm.trend,
      })
      const i = contest.value!.entries.findIndex((e) => e.id === updated.id)
      if (i >= 0) contest.value!.entries[i] = { ...contest.value!.entries[i], ...updated }
      flash('Entry updated')
    } else {
      const created = await apiPost<ApiEntry>('/contest/entries', {
        storeId: Number(entryForm.storeId),
        manager: entryForm.manager,
        upsellRate: Number(entryForm.upsellRate),
        qualifyingOrders: Number(entryForm.qualifyingOrders),
        trend: entryForm.trend,
      })
      contest.value?.entries.push(created)
      flash('Entry added')
    }
    contest.value?.entries.sort((a, b) => Number(b.upsellRate) - Number(a.upsellRate))
    Object.assign(entryForm, { id: '', storeId: '', manager: '', upsellRate: '', qualifyingOrders: '', trend: 'same' })
  } catch (e) {
    fail(e)
  }
}
async function removeEntry(e: ApiEntry) {
  try {
    await apiDelete(`/contest/entries/${e.id}`)
    contest.value!.entries = contest.value!.entries.filter((x) => x.id !== e.id)
  } catch (err) {
    fail(err)
  }
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'
const input =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200'
const btn =
  'rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40'
</script>

<template>
  <PageHeader
    eyebrow="Dashboard"
    title="Administration"
    :description="`Signed in as ${user?.name} — ${roleLabels[user?.role ?? ''] ?? ''}. Manage people, store access, and all portal content.`"
  />

  <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <!-- Tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="[
          'rounded-full px-5 py-2 text-sm font-semibold transition',
          tab === t.id
            ? 'bg-brand-600 text-white shadow-md'
            : 'border border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-600',
        ]"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <p v-if="error" class="mt-5 rounded-xl border border-accent-500/30 bg-accent-50 p-4 text-sm font-semibold text-accent-600">
      {{ error }}
    </p>
    <p v-if="toast" class="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
      {{ toast }}
    </p>
    <p v-if="loading" class="mt-10 text-center text-sm text-slate-500">Loading dashboard…</p>

    <!-- ==================== PEOPLE ==================== -->
    <div v-else-if="tab === 'people'" class="mt-8 space-y-6">
      <!-- Add person -->
      <form
        class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-5"
        @submit.prevent="createUser"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-5">Add a person</h3>
        <input v-model="newUser.name" :class="input" placeholder="Full name" required />
        <input v-model="newUser.email" :class="input" type="email" placeholder="Email" required />
        <input v-model="newUser.password" :class="input" type="password" placeholder="Password (8+ chars)" required minlength="8" />
        <select v-model="newUser.role" :class="input">
          <option v-for="r in roles" :key="r" :value="r">{{ roleLabels[r] }}</option>
        </select>
        <button :class="btn" :disabled="busy" type="submit">Add person</button>
      </form>

      <!-- Users table -->
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="u in users"
          :key="u.id"
          class="border-b border-slate-100 p-5 last:border-b-0"
        >
          <div class="flex flex-wrap items-center gap-3">
            <div class="min-w-52 flex-1">
              <p class="font-display font-bold text-slate-900">{{ u.name }}</p>
              <p class="text-xs text-slate-500">{{ u.email }}</p>
            </div>

            <select
              :class="[input, 'w-36']"
              :value="u.role"
              :disabled="u.role === 'super_admin' && user?.role !== 'super_admin'"
              @change="setRole(u, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="r in roles" :key="r" :value="r">{{ roleLabels[r] }}</option>
            </select>

            <button
              :class="[
                'rounded-full px-4 py-1.5 text-xs font-bold transition',
                u.isActive
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300',
              ]"
              @click="toggleActive(u)"
            >
              {{ u.isActive ? 'Active' : 'Disabled' }}
            </button>
            <button
              class="rounded-full px-4 py-1.5 text-xs font-bold text-accent-600 transition hover:bg-accent-50"
              @click="removeUser(u)"
            >
              Delete
            </button>
          </div>

          <!-- Store assignments -->
          <div
            v-if="u.role === 'user' || u.role === 'supervisor'"
            class="mt-3 flex flex-wrap items-center gap-2"
          >
            <span class="text-xs font-bold tracking-wide text-slate-400 uppercase">Stores:</span>
            <span
              v-for="a in u.assignments"
              :key="a.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"
            >
              {{ a.store.id }}
              <button
                class="text-brand-400 transition hover:text-accent-600"
                title="Remove assignment"
                @click="unassign(u, a)"
              >
                ×
              </button>
            </span>
            <span v-if="!u.assignments.length" class="text-xs text-slate-400">none yet</span>

            <span v-if="u.role === 'supervisor' || !u.assignments.length" class="flex items-center gap-1.5">
              <select v-model="assignPick[u.id]" :class="[input, 'w-36 !py-1 text-xs']">
                <option value="" disabled>+ assign store</option>
                <option v-for="s in assignable(u)" :key="s.id" :value="s.id">
                  {{ s.id }} — {{ s.name }}
                </option>
              </select>
              <button class="text-xs font-bold text-brand-600 hover:text-brand-800" @click="assign(u)">
                Assign
              </button>
            </span>
            <span v-else class="text-[11px] text-slate-400">(users are limited to one store)</span>
          </div>
          <p v-else class="mt-3 text-xs text-slate-400">
            {{ roleLabels[u.role] }}s see all stores — no assignment needed.
          </p>
        </div>
      </div>
    </div>

    <!-- ==================== REQUESTS ==================== -->
    <div v-else-if="tab === 'requests'" class="mt-8 space-y-4">
      <p class="text-sm text-slate-500">
        {{ openRequests.length }} open · {{ doneRequests.length }} done
      </p>
      <div
        v-for="r in requests"
        :key="r.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        :class="r.status === 'done' && 'opacity-60'"
      >
        <div class="flex flex-wrap items-center gap-3">
          <p class="font-display font-bold text-brand-800">Store {{ r.store.id }} — {{ r.store.name }}</p>
          <span class="text-xs text-slate-400">{{ fmtDate(r.createdAt.slice(0, 10)) }}</span>
          <select
            :class="[input, 'ml-auto w-36 !py-1.5 text-xs']"
            :value="r.status"
            @change="setRequestStatus(r, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="s in requestStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <button class="text-xs font-bold text-accent-600 hover:underline" @click="removeRequest(r)">
            Delete
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="i in r.items"
            :key="i"
            class="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"
          >
            {{ i }}
          </span>
        </div>
        <p class="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-3">
          <span><b>Contact:</b> {{ r.contact || '—' }}</span>
          <span><b>Needed by:</b> {{ fmtDate(r.neededBy) }}</span>
          <span v-if="r.notes" class="sm:col-span-3"><b>Notes:</b> {{ r.notes }}</span>
        </p>
      </div>
      <p v-if="!requests.length" class="text-sm text-slate-500">No requests yet.</p>
    </div>

    <!-- ==================== CALENDAR ==================== -->
    <div v-else-if="tab === 'calendar'" class="mt-8 space-y-6">
      <form
        class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        @submit.prevent="saveCampaign"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-2">
          {{ campaignEditing ? 'Edit campaign' : 'Add campaign' }}
        </h3>
        <input v-model="campaignForm.title" :class="input" placeholder="Title" required />
        <select v-model="campaignForm.type" :class="input">
          <option v-for="(m, t) in campaignTypes" :key="t" :value="t">{{ m.label }}</option>
        </select>
        <div>
          <label class="text-xs font-bold text-slate-500">Start</label>
          <input v-model="campaignForm.startDate" :class="input" type="date" required />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500">End</label>
          <input v-model="campaignForm.endDate" :class="input" type="date" required />
        </div>
        <textarea v-model="campaignForm.description" :class="input" rows="2" placeholder="Description" class="sm:col-span-2" required />
        <div class="flex gap-3 sm:col-span-2">
          <button :class="btn" type="submit">{{ campaignEditing ? 'Save changes' : 'Add campaign' }}</button>
          <button
            v-if="campaignEditing"
            type="button"
            class="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600"
            @click="Object.assign(campaignForm, blankCampaign())"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="c in campaigns"
          :key="c.id"
          class="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-b-0"
        >
          <span :class="['rounded-full px-3 py-1 text-xs font-bold', campaignTypes[c.type].chip]">
            {{ campaignTypes[c.type].label }}
          </span>
          <div class="min-w-52 flex-1">
            <p class="font-semibold text-slate-900">{{ c.title }}</p>
            <p class="text-xs text-slate-500">{{ fmtDate(c.startDate) }} – {{ fmtDate(c.endDate) }}</p>
          </div>
          <button class="text-xs font-bold text-brand-600 hover:underline" @click="editCampaign(c)">Edit</button>
          <button class="text-xs font-bold text-accent-600 hover:underline" @click="removeCampaign(c)">Delete</button>
        </div>
      </div>
    </div>

    <!-- ==================== MATERIALS ==================== -->
    <div v-else-if="tab === 'materials'" class="mt-8 space-y-6">
      <form
        class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        @submit.prevent="saveMaterial"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-2">
          {{ materialForm.id ? 'Edit material' : 'Add material' }}
        </h3>
        <input v-model="materialForm.name" :class="input" placeholder="Name" required />
        <select v-model="materialForm.category" :class="input">
          <option v-for="c in materialCategories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
        </select>
        <input v-model="materialForm.detail" :class="input" placeholder="Detail" />
        <input v-model="materialForm.leadTime" :class="input" placeholder="Lead time (e.g. 7 days)" />
        <div class="flex gap-3 sm:col-span-2">
          <button :class="btn" type="submit">{{ materialForm.id ? 'Save changes' : 'Add material' }}</button>
          <button
            v-if="materialForm.id"
            type="button"
            class="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600"
            @click="Object.assign(materialForm, blankMaterial())"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="m in materials"
          :key="m.id"
          class="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-b-0"
          :class="!m.isActive && 'opacity-50'"
        >
          <span class="w-20 rounded-full bg-slate-100 px-2 py-0.5 text-center text-[11px] font-bold text-slate-500">
            {{ materialCategories.find((c) => c.slug === m.category)?.name ?? m.category }}
          </span>
          <div class="min-w-52 flex-1">
            <p class="font-semibold text-slate-900">{{ m.name }}</p>
            <p class="text-xs text-slate-500">{{ m.detail }} · ~{{ m.leadTime }}</p>
          </div>
          <button class="text-xs font-bold text-slate-600 hover:underline" @click="toggleMaterial(m)">
            {{ m.isActive ? 'Hide' : 'Show' }}
          </button>
          <button class="text-xs font-bold text-brand-600 hover:underline" @click="editMaterial(m)">Edit</button>
          <button class="text-xs font-bold text-accent-600 hover:underline" @click="removeMaterial(m)">Delete</button>
        </div>
      </div>
    </div>

    <!-- ==================== CONTEST ==================== -->
    <div v-else-if="tab === 'contest' && contest" class="mt-8 space-y-6">
      <form
        class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-6"
        @submit.prevent="saveEntry"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-6">
          {{ entryForm.id ? 'Edit leaderboard entry' : 'Add leaderboard entry' }}
        </h3>
        <select v-model="entryForm.storeId" :class="[input, 'sm:col-span-2']" :disabled="!!entryForm.id" required>
          <option value="" disabled>Store</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.id }} — {{ s.name }}</option>
        </select>
        <input v-model="entryForm.manager" :class="input" placeholder="Manager" required />
        <input v-model.number="entryForm.upsellRate" :class="input" type="number" step="0.1" min="0" placeholder="Attach %" required />
        <input v-model.number="entryForm.qualifyingOrders" :class="input" type="number" min="0" placeholder="Orders" required />
        <select v-model="entryForm.trend" :class="input">
          <option value="up">↑ up</option>
          <option value="down">↓ down</option>
          <option value="same">– same</option>
        </select>
        <div class="flex gap-3 sm:col-span-6">
          <button :class="btn" type="submit">{{ entryForm.id ? 'Save' : 'Add entry' }}</button>
          <button
            v-if="entryForm.id"
            type="button"
            class="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600"
            @click="Object.assign(entryForm, { id: '', storeId: '', manager: '', upsellRate: '', qualifyingOrders: '', trend: 'same' })"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="(e, i) in contest.entries"
          :key="e.id"
          class="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-b-0"
        >
          <span class="w-7 text-center font-display font-extrabold text-slate-400">{{ i + 1 }}</span>
          <div class="min-w-52 flex-1">
            <p class="font-semibold text-slate-900">Store {{ e.store.id }} — {{ e.store.name }}</p>
            <p class="text-xs text-slate-500">{{ e.manager }}</p>
          </div>
          <p class="font-display text-lg font-extrabold text-slate-900">{{ Number(e.upsellRate) }}%</p>
          <p class="w-24 text-xs text-slate-500">{{ e.qualifyingOrders }} orders · {{ e.trend }}</p>
          <button class="text-xs font-bold text-brand-600 hover:underline" @click="editEntry(e)">Edit</button>
          <button class="text-xs font-bold text-accent-600 hover:underline" @click="removeEntry(e)">Delete</button>
        </div>
      </div>
    </div>
  </section>
</template>
