import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'ADMIN'
  cpf?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setTokens: (access: string, refresh: string) => void
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (identifier: string, password: string) => {
        const { data } = await api.post('/auth/login', { identifier, password })
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken })
      },

      setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },
    }),
    {
      name: 'barber-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
