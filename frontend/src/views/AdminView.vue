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
  winner1StoreId: number | null; winner2StoreId: number | null; winner3StoreId: number | null
  isActive: boolean
}

// ---------- shared state ----------
type Tab = 'people' | 'requests' | 'calendar' | 'materials' | 'contest'
const tab = ref<Tab>('people')
const isSupervisor = computed(() => user.value?.role === 'supervisor')
const isViewer = computed(() => user.value?.role === 'user')
const canManage = computed(() => ['admin', 'super_admin'].includes(user.value?.role ?? ''))
const tabs = computed(() => {
  const all: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'people', label: 'People & Stores', icon: 'users' },
    { id: 'requests', label: isViewer.value ? "My store's requests" : 'Requests', icon: 'inbox', badge: openCount.value },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'materials', label: 'Materials', icon: 'box' },
    { id: 'contest', label: 'Contest', icon: 'trophy' },
  ]
  // Users only watch their store's requests; supervisors also manage people.
  if (isViewer.value) return all.filter((t) => t.id === 'requests')
  return isSupervisor.value ? all.slice(0, 2) : all
})
const activeTab = computed(() =>
  tabs.value.some((t) => t.id === tab.value) ? tab.value : tabs.value[0]!.id,
)

const loading = ref(true)
const error = ref('')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout>
const flash = (msg: string) => {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}
const fail = (e: unknown) => {
  error.value = e instanceof Error ? e.message : 'Something went wrong'
  setTimeout(() => (error.value = ''), 5000)
}

// Two-tap delete: first click arms, second confirms. Auto-disarms.
const confirming = ref(new Set<string>())
function askConfirm(key: string, fn: () => void | Promise<void>) {
  if (confirming.value.has(key)) {
    confirming.value.delete(key)
    confirming.value = new Set(confirming.value)
    void fn()
    return
  }
  confirming.value.add(key)
  confirming.value = new Set(confirming.value)
  setTimeout(() => {
    confirming.value.delete(key)
    confirming.value = new Set(confirming.value)
  }, 3000)
}

const stores = ref<ApiStore[]>([])
const users = ref<ApiUser[]>([])
const requests = ref<ApiRequest[]>([])
const campaigns = ref<ApiCampaign[]>([])
const materials = ref<ApiMaterial[]>([])
const contest = ref<ApiContest | null>(null)
const contestHistory = ref<ApiContest[]>([])
const selectedContestId = ref('')

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  user: 'User',
}
const roleBadge: Record<string, string> = {
  super_admin: 'bg-violet-100 text-violet-700',
  admin: 'bg-brand-100 text-brand-700',
  supervisor: 'bg-amber-100 text-amber-700',
  user: 'bg-slate-100 text-slate-600',
}
const roles = ['user', 'supervisor', 'admin', 'super_admin'] as const

const statusMeta: Record<string, { label: string; chip: string }> = {
  new: { label: 'New', chip: 'bg-accent-100 text-accent-700' },
  in_progress: { label: 'In progress', chip: 'bg-amber-100 text-amber-700' },
  done: { label: 'Done', chip: 'bg-emerald-100 text-emerald-700' },
}

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    // /stores/mine: all stores for admins, only assigned ones for supervisor/user.
    const [s, r] = await Promise.all([
      apiGet<ApiStore[]>('/stores/mine'),
      apiGet<ApiRequest[]>('/requests'),
    ])
    stores.value = s
    requests.value = r
    if (!isViewer.value) {
      users.value = await apiGet<ApiUser[]>('/users')
    }
    if (canManage.value) {
      const [c, m, ct] = await Promise.all([
        apiGet<ApiCampaign[]>('/campaigns'),
        apiGet<ApiMaterial[]>('/materials/all'),
        apiGet<ApiContest[]>('/contest/admin/all'),
      ])
      campaigns.value = c
      materials.value = m
      contestHistory.value = ct
      contest.value = ct.find((item) => item.isActive) ?? ct[0] ?? null
      selectedContestId.value = contest.value?.id ?? ''
    }
  } catch (e) {
    fail(e)
  } finally {
    loading.value = false
  }
}
onMounted(loadAll)

// ---------- stats strip ----------
const openCount = computed(() => requests.value.filter((r) => r.status !== 'done').length)
const stats = computed(() => [
  {
    label: isSupervisor.value || isViewer.value ? 'My stores' : 'Stores',
    value: stores.value.length,
    icon: 'store',
  },
  ...(isViewer.value ? [] : [{ label: 'People', value: users.value.length, icon: 'users' }]),
  { label: 'Open requests', value: openCount.value, icon: 'inbox', accent: openCount.value > 0 },
  ...(canManage.value
    ? [
        { label: 'Campaigns', value: campaigns.value.length, icon: 'calendar' },
        { label: 'Materials', value: materials.value.length, icon: 'box' },
      ]
    : []),
])

// ---------- people ----------
const newUser = reactive({ name: '', email: '', password: '', role: 'user' as string })
const busy = ref(false)
const showAddUser = ref(false)
const search = ref('')
const roleFilter = ref('all')

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter(
    (u) =>
      (roleFilter.value === 'all' || u.role === roleFilter.value) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  )
})

async function createUser() {
  busy.value = true
  error.value = ''
  try {
    const created = await apiPost<ApiUser>('/users', newUser)
    users.value.push(created)
    Object.assign(newUser, { name: '', email: '', password: '', role: 'user' })
    showAddUser.value = false
    flash(`${created.name} added — they can sign in now`)
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
    flash(`Store ${storeId} assigned to ${u.name}`)
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
const reqFilter = ref<'all' | 'new' | 'in_progress' | 'done'>('all')
const reqCounts = computed(() => ({
  all: requests.value.length,
  new: requests.value.filter((r) => r.status === 'new').length,
  in_progress: requests.value.filter((r) => r.status === 'in_progress').length,
  done: requests.value.filter((r) => r.status === 'done').length,
}))
const filteredRequests = computed(() =>
  reqFilter.value === 'all'
    ? requests.value
    : requests.value.filter((r) => r.status === reqFilter.value),
)

async function setRequestStatus(r: ApiRequest, status: string) {
  try {
    const updated = await apiPatch<ApiRequest>(`/requests/${r.id}`, { status })
    Object.assign(r, updated)
    flash(`Request ${statusMeta[status]?.label ?? status}`)
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

// ---------- calendar ----------
const blankCampaign = () => ({
  id: '',
  title: '',
  startDate: '',
  endDate: '',
  type: 'national' as CampaignType,
  description: '',
})
const campaignForm = reactive(blankCampaign())
const campaignEditing = computed(() => campaignForm.id !== '')
const showCampaignForm = ref(false)
const sortedCampaigns = computed(() =>
  [...campaigns.value].sort((a, b) => a.startDate.localeCompare(b.startDate)),
)

function editCampaign(c: ApiCampaign) {
  Object.assign(campaignForm, { ...c })
  showCampaignForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    showCampaignForm.value = false
  } catch (e) {
    fail(e)
  }
}
async function removeCampaign(c: ApiCampaign) {
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
const showMaterialForm = ref(false)
const materialFilter = ref('all')
const filteredMaterials = computed(() =>
  materialFilter.value === 'all'
    ? materials.value
    : materials.value.filter((m) => m.category === materialFilter.value),
)

function editMaterial(m: ApiMaterial) {
  Object.assign(materialForm, {
    id: m.id, name: m.name, detail: m.detail, leadTime: m.leadTime, category: m.category,
  })
  showMaterialForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    showMaterialForm.value = false
  } catch (e) {
    fail(e)
  }
}
async function toggleMaterial(m: ApiMaterial) {
  try {
    const updated = await apiPatch<ApiMaterial>(`/materials/${m.id}`, { isActive: !m.isActive })
    Object.assign(m, updated)
    flash(updated.isActive ? `${m.name} visible` : `${m.name} hidden`)
  } catch (e) {
    fail(e)
  }
}
async function removeMaterial(m: ApiMaterial) {
  try {
    await apiDelete(`/materials/${m.id}`)
    materials.value = materials.value.filter((x) => x.id !== m.id)
  } catch (e) {
    fail(e)
  }
}

// ---------- contest ----------
const blankContest = () => ({
  id: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  teamPrize: '',
  managerPrize: '',
  winner1StoreId: '' as number | '',
  winner2StoreId: '' as number | '',
  winner3StoreId: '' as number | '',
})
const contestForm = reactive(blankContest())
const showContestForm = ref(false)

function selectContest() {
  contest.value =
    contestHistory.value.find((item) => item.id === selectedContestId.value) ?? null
  Object.assign(contestForm, blankContest())
  showContestForm.value = false
  showEntryForm.value = false
}

function saveContestInList(saved: ApiContest) {
  const index = contestHistory.value.findIndex((item) => item.id === saved.id)
  if (index >= 0) contestHistory.value[index] = saved
  else contestHistory.value.unshift(saved)
  contest.value = saved
  selectedContestId.value = saved.id
}

function addContest() {
  Object.assign(contestForm, blankContest())
  showContestForm.value = true
}

function editContest() {
  if (!contest.value) return
  Object.assign(contestForm, {
    id: contest.value.id,
    title: contest.value.title,
    description: contest.value.intro,
    startDate: contest.value.startDate,
    endDate: contest.value.endDate,
    teamPrize: contest.value.teamPrize,
    managerPrize: contest.value.storePrize,
    winner1StoreId: contest.value.winner1StoreId ?? '',
    winner2StoreId: contest.value.winner2StoreId ?? '',
    winner3StoreId: contest.value.winner3StoreId ?? '',
  })
  showContestForm.value = true
}

async function saveContestEvent() {
  error.value = ''
  try {
    const body = {
      title: contestForm.title,
      intro: contestForm.description,
      startDate: contestForm.startDate,
      endDate: contestForm.endDate,
      teamPrize: contestForm.teamPrize,
      storePrize: contestForm.managerPrize,
      product: contest.value?.product ?? 'Upsell',
      winner1StoreId: contestForm.winner1StoreId === '' ? null : Number(contestForm.winner1StoreId),
      winner2StoreId: contestForm.winner2StoreId === '' ? null : Number(contestForm.winner2StoreId),
      winner3StoreId: contestForm.winner3StoreId === '' ? null : Number(contestForm.winner3StoreId),
    }
    if (contestForm.id) {
      const saved = await apiPatch<ApiContest>(`/contest/${contestForm.id}`, body)
      saveContestInList(saved)
      flash('Contest updated')
    } else {
      contestHistory.value = contestHistory.value.map((item) => ({ ...item, isActive: false }))
      const saved = await apiPost<ApiContest>('/contest', body)
      saveContestInList(saved)
      flash('Contest event published')
    }
    Object.assign(contestForm, blankContest())
    showContestForm.value = false
  } catch (e) {
    fail(e)
  }
}

async function removeContest(id: string) {
  try {
    await apiDelete(`/contest/${id}`)
    contestHistory.value = contestHistory.value.filter((item) => item.id !== id)
    contest.value = contestHistory.value.find((item) => item.isActive) ?? contestHistory.value[0] ?? null
    selectedContestId.value = contest.value?.id ?? ''
    Object.assign(contestForm, blankContest())
    showContestForm.value = false
    showEntryForm.value = false
    flash('Contest removed')
  } catch (e) {
    fail(e)
  }
}

function confirmRemoveContest(id: string) {
  askConfirm(`contest-${id}`, () => removeContest(id))
}

const entryForm = reactive({
  id: '', storeId: '' as number | '', manager: '',
  upsellRate: '' as number | '', qualifyingOrders: '' as number | '',
  trend: 'same' as 'up' | 'down' | 'same',
})
const showEntryForm = ref(false)

function editEntry(e: ApiEntry) {
  Object.assign(entryForm, {
    id: e.id, storeId: e.store.id, manager: e.manager,
    upsellRate: Number(e.upsellRate), qualifyingOrders: e.qualifyingOrders, trend: e.trend,
  })
  showEntryForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function saveEntry() {
  error.value = ''
  try {
    if (entryForm.id) {
      const updated = await apiPatch<ApiContest>(`/contest/entries/${entryForm.id}`, {
        manager: entryForm.manager,
        upsellRate: Number(entryForm.upsellRate),
        qualifyingOrders: Number(entryForm.qualifyingOrders),
        trend: entryForm.trend,
      })
      saveContestInList(updated)
      flash('Entry updated')
    } else {
      const updated = await apiPost<ApiContest>('/contest/entries', {
        storeId: Number(entryForm.storeId),
        manager: entryForm.manager,
        upsellRate: Number(entryForm.upsellRate),
        qualifyingOrders: Number(entryForm.qualifyingOrders),
        trend: entryForm.trend,
      })
      saveContestInList(updated)
      flash('Entry added')
    }
    Object.assign(entryForm, { id: '', storeId: '', manager: '', upsellRate: '', qualifyingOrders: '', trend: 'same' })
    showEntryForm.value = false
  } catch (e) {
    fail(e)
  }
}
async function removeEntry(e: ApiEntry) {
  try {
    await apiDelete(`/contest/entries/${e.id}`)
    if (contest.value) {
      contest.value.entries = contest.value.entries.filter((entry) => entry.id !== e.id)
      saveContestInList(contest.value)
    }
  } catch (err) {
    fail(err)
  }
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'
const fmtRange = (start: string, end: string) => `${fmtDate(start)} – ${fmtDate(end)}`

const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200'
const btn =
  'rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40'
const ghostBtn =
  'rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400'
const confirmBtn = (key: string) =>
  confirming.value.has(key)
    ? 'rounded-full bg-accent-500 px-3 py-1.5 text-xs font-bold text-white'
    : 'rounded-full px-3 py-1.5 text-xs font-bold text-accent-600 transition hover:bg-accent-50'
</script>

<template>
  <PageHeader
    eyebrow="Dashboard"
    title="Administration"
    :description="`Signed in as ${user?.name} — ${roleLabels[user?.role ?? ''] ?? ''}.`"
  />

  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <!-- Stats strip -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p class="font-display text-2xl font-extrabold" :class="s.accent ? 'text-accent-600' : 'text-slate-900'">
          {{ s.value }}
        </p>
        <p class="mt-0.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">{{ s.label }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="[
          'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition',
          tab === t.id
            ? 'bg-brand-600 text-white shadow-md'
            : 'border border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-600',
        ]"
        @click="tab = t.id"
      >
        <svg v-if="t.icon === 'users'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <svg v-else-if="t.icon === 'inbox'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
        <svg v-else-if="t.icon === 'calendar'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <svg v-else-if="t.icon === 'box'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
        <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4zm10 1h3a2 2 0 0 1-2 4h-1M7 5H4a2 2 0 0 0 2 4h1"/></svg>
        {{ t.label }}
        <span
          v-if="t.badge"
          class="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-extrabold text-white"
        >
          {{ t.badge }}
        </span>
      </button>
    </div>

    <p v-if="loading" class="mt-14 text-center text-sm text-slate-500">Loading dashboard…</p>

    <!-- ==================== PEOPLE ==================== -->
    <div v-else-if="activeTab === 'people'" class="mt-8 space-y-5">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-56 flex-1">
          <svg class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input v-model="search" :class="[input, '!pl-10']" type="search" placeholder="Search name or email…" />
        </div>
        <div class="flex gap-1.5">
          <button
            v-for="r in ['all', ...roles]"
            :key="r"
            :class="[
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
              roleFilter === r ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            ]"
            @click="roleFilter = r"
          >
            {{ r === 'all' ? 'All' : roleLabels[r] }}
          </button>
        </div>
        <button v-if="canManage" :class="btn" class="ml-auto" @click="showAddUser = !showAddUser">
          {{ showAddUser ? '− Close' : '+ Add person' }}
        </button>
      </div>

      <!-- Add person -->
      <form
        v-if="showAddUser && canManage"
        class="grid gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-6 sm:grid-cols-5"
        @submit.prevent="createUser"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-5">New account</h3>
        <input v-model="newUser.name" :class="input" placeholder="Full name" required />
        <input v-model="newUser.email" :class="input" type="email" placeholder="Email" required />
        <input v-model="newUser.password" :class="input" type="password" placeholder="Password (8+ chars)" required minlength="8" />
        <select v-model="newUser.role" :class="input">
          <option v-for="r in roles" :key="r" :value="r">{{ roleLabels[r] }}</option>
        </select>
        <button :class="btn" :disabled="busy" type="submit">{{ busy ? 'Adding…' : 'Add person' }}</button>
      </form>

      <!-- Users -->
      <div v-if="!filteredUsers.length" class="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No people match your filters.
      </div>
      <div
        v-for="u in filteredUsers"
        :key="u.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-extrabold text-white">
            {{ initials(u.name) }}
          </span>
          <div class="min-w-44 flex-1">
            <p class="font-display font-bold text-slate-900">{{ u.name }}</p>
            <p class="text-xs text-slate-500">{{ u.email }}</p>
          </div>
          <span :class="['rounded-full px-3 py-1 text-xs font-bold', roleBadge[u.role]]">
            {{ roleLabels[u.role] }}
          </span>
          <span v-if="!u.isActive" class="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
            Disabled
          </span>

          <!-- Role changes stay admin-only; supervisors manage user accounts in their stores -->
          <select
            v-if="canManage"
            :class="[input, 'w-32 !py-1.5 text-xs']"
            :value="u.role"
            :disabled="u.role === 'super_admin' && user?.role !== 'super_admin'"
            title="Change role"
            @change="setRole(u, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="r in roles" :key="r" :value="r">{{ roleLabels[r] }}</option>
          </select>
          <template v-if="canManage || (isSupervisor && u.role === 'user')">
            <button
              :class="ghostBtn + ' !px-3 !py-1.5 text-xs'"
              :title="u.isActive ? 'Deactivate account' : 'Activate account'"
              @click="toggleActive(u)"
            >
              {{ u.isActive ? 'Disable' : 'Enable' }}
            </button>
            <button :class="confirmBtn(`u-${u.id}`)" @click="askConfirm(`u-${u.id}`, () => removeUser(u))">
              {{ confirming.has(`u-${u.id}`) ? 'Confirm delete' : 'Delete' }}
            </button>
          </template>
        </div>

        <!-- Store assignments -->
        <div
          v-if="u.role === 'user' || u.role === 'supervisor'"
          class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
        >
          <span class="text-xs font-bold tracking-wide text-slate-400 uppercase">Stores</span>
          <span
            v-for="a in u.assignments"
            :key="a.id"
            class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"
          >
            {{ a.store.id }} · {{ a.store.name }}
            <button
              class="text-brand-400 transition hover:text-accent-600"
              title="Remove assignment"
              @click="unassign(u, a)"
            >
              ×
            </button>
          </span>
          <span v-if="!u.assignments.length" class="text-xs text-slate-400">no store yet</span>

          <span v-if="u.role === 'supervisor' || !u.assignments.length" class="flex items-center gap-1.5">
            <select v-model="assignPick[u.id]" :class="[input, 'w-44 !py-1.5 text-xs']">
              <option value="" disabled>Assign a store…</option>
              <option v-for="s in assignable(u)" :key="s.id" :value="s.id">
                {{ s.id }} — {{ s.name }}
              </option>
            </select>
            <button
              class="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:opacity-40"
              :disabled="!assignPick[u.id]"
              @click="assign(u)"
            >
              Assign
            </button>
          </span>
          <span v-else class="text-[11px] text-slate-400">(users are limited to one store)</span>
        </div>
        <p v-else class="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
          {{ roleLabels[u.role] }}s see all stores — no assignment needed.
        </p>
      </div>
    </div>

    <!-- ==================== REQUESTS ==================== -->
    <div v-else-if="activeTab === 'requests'" class="mt-8 space-y-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in (['all', 'new', 'in_progress', 'done'] as const)"
          :key="f"
          :class="[
            'rounded-full px-4 py-1.5 text-xs font-bold transition',
            reqFilter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          ]"
          @click="reqFilter = f"
        >
          {{ f === 'all' ? 'All' : statusMeta[f]!.label }} · {{ reqCounts[f] }}
        </button>
      </div>

      <div v-if="!filteredRequests.length" class="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        Nothing here — new submissions from the request form will land in this inbox.
      </div>
      <div
        v-for="r in filteredRequests"
        :key="r.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        :class="r.status === 'done' && 'opacity-60'"
      >
        <div class="flex flex-wrap items-center gap-3">
          <p class="font-display font-bold text-brand-800">Store {{ r.store.id }} — {{ r.store.name }}</p>
          <span :class="['rounded-full px-3 py-1 text-xs font-bold', statusMeta[r.status]?.chip]">
            {{ statusMeta[r.status]?.label ?? r.status }}
          </span>
          <span class="text-xs text-slate-400">{{ fmtDate(r.createdAt.slice(0, 10)) }}</span>

          <template v-if="!isViewer">
            <span class="ml-auto flex gap-2">
              <button
                v-if="r.status === 'new'"
                :class="ghostBtn + ' !px-3 !py-1.5 text-xs !border-amber-400 !text-amber-700'"
                @click="setRequestStatus(r, 'in_progress')"
              >
                Start work
              </button>
              <button
                v-if="r.status !== 'done'"
                class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                @click="setRequestStatus(r, 'done')"
              >
                Mark done
              </button>
              <button v-if="canManage" :class="confirmBtn(`r-${r.id}`)" @click="askConfirm(`r-${r.id}`, () => removeRequest(r))">
                {{ confirming.has(`r-${r.id}`) ? 'Confirm' : 'Delete' }}
              </button>
            </span>
          </template>
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
    </div>

    <!-- ==================== CALENDAR ==================== -->
    <div v-else-if="activeTab === 'calendar'" class="mt-8 space-y-5">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-500">{{ campaigns.length }} campaigns — changes go live on the public calendar immediately.</p>
        <button :class="btn" @click="showCampaignForm = !showCampaignForm">
          {{ showCampaignForm ? '− Close' : '+ Add campaign' }}
        </button>
      </div>

      <form
        v-if="showCampaignForm"
        class="grid gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-6 sm:grid-cols-2"
        @submit.prevent="saveCampaign"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-2">
          {{ campaignEditing ? 'Edit campaign' : 'New campaign' }}
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
        <textarea v-model="campaignForm.description" :class="[input, 'sm:col-span-2']" rows="2" placeholder="Description" required />
        <div class="flex gap-3 sm:col-span-2">
          <button :class="btn" type="submit">{{ campaignEditing ? 'Save changes' : 'Add campaign' }}</button>
          <button
            v-if="campaignEditing"
            type="button"
            :class="ghostBtn"
            @click="Object.assign(campaignForm, blankCampaign()); showCampaignForm = false"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="c in sortedCampaigns"
          :key="c.id"
          class="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-b-0"
        >
          <span :class="['h-8 w-1.5 shrink-0 rounded-full', campaignTypes[c.type].dot]" />
          <span :class="['rounded-full px-3 py-1 text-xs font-bold', campaignTypes[c.type].chip]">
            {{ campaignTypes[c.type].label }}
          </span>
          <div class="min-w-52 flex-1">
            <p class="font-semibold text-slate-900">{{ c.title }}</p>
            <p class="text-xs text-slate-500">{{ fmtRange(c.startDate, c.endDate) }}</p>
          </div>
          <button :class="ghostBtn + ' !px-3 !py-1.5 text-xs'" @click="editCampaign(c)">Edit</button>
          <button :class="confirmBtn(`c-${c.id}`)" @click="askConfirm(`c-${c.id}`, () => removeCampaign(c))">
            {{ confirming.has(`c-${c.id}`) ? 'Confirm' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== MATERIALS ==================== -->
    <div v-else-if="activeTab === 'materials'" class="mt-8 space-y-5">
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="materialFilter" :class="[input, 'w-48']">
          <option value="all">All categories</option>
          <option v-for="c in materialCategories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
        </select>
        <p class="text-sm text-slate-500">{{ filteredMaterials.length }} items</p>
        <button :class="btn" class="ml-auto" @click="showMaterialForm = !showMaterialForm">
          {{ showMaterialForm ? '− Close' : '+ Add material' }}
        </button>
      </div>

      <form
        v-if="showMaterialForm"
        class="grid gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-6 sm:grid-cols-2"
        @submit.prevent="saveMaterial"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-2">
          {{ materialForm.id ? 'Edit material' : 'New material' }}
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
            :class="ghostBtn"
            @click="Object.assign(materialForm, blankMaterial()); showMaterialForm = false"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="m in filteredMaterials"
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
          <button :class="ghostBtn + ' !px-3 !py-1.5 text-xs'" @click="toggleMaterial(m)">
            {{ m.isActive ? 'Hide' : 'Show' }}
          </button>
          <button :class="ghostBtn + ' !px-3 !py-1.5 text-xs'" @click="editMaterial(m)">Edit</button>
          <button :class="confirmBtn(`m-${m.id}`)" @click="askConfirm(`m-${m.id}`, () => removeMaterial(m))">
            {{ confirming.has(`m-${m.id}`) ? 'Confirm' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== CONTEST ==================== -->
    <div v-else-if="activeTab === 'contest'" class="mt-8 space-y-5">
      <div v-if="contestHistory.length > 1" class="max-w-md">
        <label class="mb-1 block text-xs font-bold text-slate-500">Contest event</label>
        <select v-model="selectedContestId" :class="input" @change="selectContest">
          <option v-for="item in contestHistory" :key="item.id" :value="item.id">
            {{ item.title }} · {{ fmtRange(item.startDate, item.endDate) }}
          </option>
        </select>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <template v-if="contest">
            <p class="font-display font-bold text-slate-900">{{ contest.title }}</p>
            <p class="text-sm text-slate-500">
              {{ fmtRange(contest.startDate, contest.endDate) }} ·
              {{ contest.isActive ? 'Current event' : 'Past event' }} ·
              {{ contest.entries.length }} stores on the board
            </p>
          </template>
          <template v-else>
            <p class="font-display font-bold text-slate-900">No contest event configured</p>
            <p class="text-sm text-slate-500">There are no live contests right now.</p>
          </template>
        </div>
        <div class="flex gap-2">
          <button :class="btn" @click="addContest">+ Add event</button>
          <button v-if="contest" :class="ghostBtn" @click="editContest">Edit event</button>
          <button
            v-if="contest"
            :class="confirmBtn(`contest-${contest.id}`)"
            @click="confirmRemoveContest(contest.id)"
          >
            {{ confirming.has(`contest-${contest.id}`) ? 'Confirm remove' : 'Remove event' }}
          </button>
          <button v-if="contest?.isActive" :class="ghostBtn" @click="showEntryForm = !showEntryForm">
            {{ showEntryForm ? '− Close' : '+ Add entry' }}
          </button>
        </div>
      </div>

      <form
        v-if="showContestForm"
        class="grid gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-6 sm:grid-cols-2"
        @submit.prevent="saveContestEvent"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-2">
          {{ contestForm.id ? 'Edit contest event' : 'New contest event' }}
        </h3>
        <input v-model="contestForm.title" :class="[input, 'sm:col-span-2']" placeholder="Event title" required />
        <textarea v-model="contestForm.description" :class="[input, 'sm:col-span-2']" rows="3" placeholder="Description" required />
        <div>
          <label class="text-xs font-bold text-slate-500">Start date</label>
          <input v-model="contestForm.startDate" :class="input" type="date" required />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500">End date</label>
          <input v-model="contestForm.endDate" :class="input" type="date" :min="contestForm.startDate" required />
        </div>
        <input v-model="contestForm.teamPrize" :class="input" placeholder="Team prize" required />
        <input v-model="contestForm.managerPrize" :class="input" placeholder="Manager prize" required />
        <div>
          <label class="mb-1 block text-xs font-bold text-slate-500">1st place store</label>
          <select v-model="contestForm.winner1StoreId" :class="input">
            <option value="">Not selected</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.id }} — {{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold text-slate-500">2nd place store</label>
          <select v-model="contestForm.winner2StoreId" :class="input">
            <option value="">Not selected</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.id }} — {{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold text-slate-500">3rd place store</label>
          <select v-model="contestForm.winner3StoreId" :class="input">
            <option value="">Not selected</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.id }} — {{ s.name }}</option>
          </select>
        </div>
        <div class="flex gap-3 sm:col-span-2">
          <button :class="btn" type="submit">{{ contestForm.id ? 'Save changes' : 'Publish event' }}</button>
          <button
            type="button"
            :class="ghostBtn"
            @click="Object.assign(contestForm, blankContest()); showContestForm = false"
          >
            Cancel
          </button>
        </div>
      </form>

      <form
        v-if="showEntryForm && contest?.isActive"
        class="grid gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-6 sm:grid-cols-6"
        @submit.prevent="saveEntry"
      >
        <h3 class="font-display text-lg font-bold text-slate-900 sm:col-span-6">
          {{ entryForm.id ? 'Edit leaderboard entry' : 'New leaderboard entry' }}
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
            :class="ghostBtn"
            @click="Object.assign(entryForm, { id: '', storeId: '', manager: '', upsellRate: '', qualifyingOrders: '', trend: 'same' }); showEntryForm = false"
          >
            Cancel
          </button>
        </div>
      </form>

      <div v-if="contest" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          v-for="(e, i) in contest.entries"
          :key="e.id"
          class="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-b-0"
        >
          <span
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-extrabold',
              i === 0 ? 'bg-gold-400 text-white' : i < 3 ? 'bg-slate-200 text-slate-600' : 'text-slate-400',
            ]"
          >
            {{ i + 1 }}
          </span>
          <div class="min-w-52 flex-1">
            <p class="font-semibold text-slate-900">Store {{ e.store.id }} — {{ e.store.name }}</p>
            <p class="text-xs text-slate-500">{{ e.manager }}</p>
          </div>
          <p class="font-display text-lg font-extrabold text-slate-900">{{ Number(e.upsellRate) }}%</p>
          <p class="w-28 text-xs text-slate-500">{{ e.qualifyingOrders }} orders · {{ e.trend }}</p>
          <button v-if="contest.isActive" :class="ghostBtn + ' !px-3 !py-1.5 text-xs'" @click="editEntry(e)">Edit</button>
          <button
            v-if="contest.isActive"
            :class="confirmBtn(`e-${e.id}`)"
            @click="askConfirm(`e-${e.id}`, () => removeEntry(e))"
          >
            {{ confirming.has(`e-${e.id}`) ? 'Confirm' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Floating toast + error -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
        {{ toast }}
      </div>
    </Transition>
    <Transition name="toast">
      <div
        v-if="error"
        class="fixed right-5 bottom-5 z-50 max-w-sm rounded-2xl bg-accent-600 px-5 py-3 text-sm font-bold text-white shadow-xl"
      >
        {{ error }}
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
