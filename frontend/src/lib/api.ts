import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Attach access token
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('barber-auth')
  if (raw) {
    try {
      const state = JSON.parse(raw)
      const token = state?.state?.accessToken
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      isRefreshing = true
      try {
        const raw = localStorage.getItem('barber-auth')
        const state = raw ? JSON.parse(raw)?.state : null
        if (!state?.refreshToken || !state?.user?.id) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          userId: state.user.id,
          refreshToken: state.refreshToken,
        })

        // Update stored tokens
        const updated = { ...state, accessToken: data.accessToken, refreshToken: data.refreshToken }
        localStorage.setItem('barber-auth', JSON.stringify({ state: updated, version: 0 }))

        refreshQueue.forEach((cb) => cb(data.accessToken))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('barber-auth')
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
