import { computed, reactive } from 'vue'
import { apiPost, AUTH_STORAGE_KEY } from './api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'supervisor' | 'user'
}

interface Stored {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

const state = reactive<{ auth: Stored | null }>({
  auth: JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? 'null'),
})

export function useAuth() {
  const user = computed(() => state.auth?.user ?? null)
  const isLoggedIn = computed(() => state.auth !== null)

  async function login(email: string, password: string) {
    const res = await apiPost<Stored>('/auth/login', { email, password })
    state.auth = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.auth))
  }

  function logout() {
    const refreshToken = state.auth?.refreshToken
    if (refreshToken)
      apiPost('/auth/logout', { refreshToken }).catch(() => undefined)
    state.auth = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return { user, isLoggedIn, login, logout }
}
