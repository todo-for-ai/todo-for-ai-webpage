import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { apiClient } from '../../api'
import { getApiBaseUrl } from '../../utils/apiConfig'
import {
  isTokenExpired,
  shouldRefreshToken,
  getTokenRemainingTime,
  parseJWT
} from '../../utils/jwtUtils'
export interface User {
  id: number
  auth0_user_id: string
  email: string
  email_verified: boolean
  username?: string
  nickname?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  provider?: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  last_login_at?: string
  last_active_at?: string
  preferences?: Record<string, any>
  timezone?: string
  locale?: string
  created_at: string
  updated_at: string
}
interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitializing: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (redirectUri?: string) => void
  loginWithGitHub: (redirectUri?: string) => void
  loginWithGoogle: (redirectUri?: string) => void
  loginWithGuest: (redirectUri?: string) => void
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  checkAuth: () => Promise<boolean>
  clearAuth: () => void
  isTokenExpired: () => boolean
  shouldRefreshToken: () => boolean
  getTokenRemainingTime: () => number
  refreshTokens: () => Promise<boolean>
  checkTokenExpiration: () => void
}
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitializing: false,
}
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setUser: (user) => {
          set({ 
            user, 
            isAuthenticated: !!user 
          })
        },
        setToken: (token) => {
          set({ token, isAuthenticated: !!token })
          if (token) {
            localStorage.setItem('auth_token', token)
            localStorage.setItem('access_token', token)
          } else {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('access_token')
          }
        },
        setRefreshToken: (refreshToken) => {
          set({ refreshToken })
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken)
          } else {
            localStorage.removeItem('refresh_token')
          }
        },
        setTokens: (accessToken, refreshToken) => {
          set({
            token: accessToken,
            refreshToken,
            isAuthenticated: !!accessToken
          })
          if (accessToken) {
            localStorage.setItem('auth_token', accessToken)
            localStorage.setItem('access_token', accessToken)
          } else {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('access_token')
          }
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken)
          } else {
            localStorage.removeItem('refresh_token')
          }
        },
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        login: (redirectUri) => {
          get().loginWithGitHub(redirectUri)
        },
        loginWithGitHub: (redirectUri) => {
          const baseUrl = getApiBaseUrl()
          const returnTo = redirectUri || window.location.href
          window.location.href = `${baseUrl}/auth/login/github?return_to=${encodeURIComponent(returnTo)}`
        },
        loginWithGoogle: (redirectUri) => {
          const baseUrl = getApiBaseUrl()
          const returnTo = redirectUri || window.location.href
          window.location.href = `${baseUrl}/auth/login/google?return_to=${encodeURIComponent(returnTo)}`
        },
        loginWithGuest: (redirectUri) => {
          const baseUrl = getApiBaseUrl()
          const returnTo = redirectUri || window.location.href
          window.location.href = `${baseUrl}/auth/login/guest?return_to=${encodeURIComponent(returnTo)}`
        },
        logout: async () => {
          const { token } = get()
          try {
            set({ isLoading: true, error: null })
            if (token) {
              await apiClient.post('/auth/logout', {
                return_to: window.location.origin + '/todo-for-ai/pages'
              })
            }
          } catch (error: any) {
            console.error('Logout error:', error)
          } finally {
            get().clearAuth()
            window.location.href = '/todo-for-ai/pages/login'
          }
        },
        fetchCurrentUser: async () => {
          const { token, isLoading } = get()
          if (!token) {
            set({ user: null, isAuthenticated: false })
            return
          }
          if (isLoading) {
            return
          }
          try {
            set({ isLoading: true, error: null })
            const response = await apiClient.get<User>('/auth/me')
            const user = response
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            })
          } catch (error: any) {
            console.error('Failed to fetch current user:', error)
            if (error.response?.status === 401) {
              get().clearAuth()
            }
            set({
              error: error.response?.data?.error?.message || '获取用户信息失败',
              isLoading: false
            })
          }
        },
        updateUser: async (userData) => {
          try {
            set({ isLoading: true, error: null })
            const response = await apiClient.put<User>('/auth/me', userData)
            const updatedUser = response
            set({ 
              user: updatedUser,
              isLoading: false 
            })
          } catch (error: any) {
            set({ 
              error: error.response?.data?.error?.message || '更新用户信息失败',
              isLoading: false 
            })
            throw error
          }
        },
        checkAuth: async () => {
          const { token, isInitializing } = get()
          if (!token) {
            return false
          }
          if (isInitializing) {
            return get().isAuthenticated
          }
          try {
            set({ isInitializing: true })
            await get().fetchCurrentUser()
            return get().isAuthenticated
          } catch (error) {
            console.error('Auth check failed:', error)
            get().clearAuth()
            return false
          } finally {
            set({ isInitializing: false })
          }
        },
        clearAuth: () => {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            ...initialState
          })
        },
        isTokenExpired: () => {
          const { token } = get()
          return !token || isTokenExpired(token)
        },
        shouldRefreshToken: () => {
          const { token } = get()
          return token ? shouldRefreshToken(token) : false
        },
        getTokenRemainingTime: () => {
          const { token } = get()
          return token ? getTokenRemainingTime(token) : 0
        },
        refreshTokens: async () => {
          const { refreshToken: currentRefreshToken } = get()
          if (!currentRefreshToken) {
            console.log('[AuthStore] 没有refresh token，无法刷新')
            get().clearAuth()
            return false
          }
          try {
            set({ isLoading: true, error: null })
            const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${currentRefreshToken}`,
                'Content-Type': 'application/json'
              }
            })
            if (!response.ok) {
              throw new Error(`Refresh failed: ${response.status}`)
            }
            const data = await response.json()
            const { access_token, refresh_token } = data
            if (access_token && refresh_token) {
              get().setTokens(access_token, refresh_token)
              console.log('[AuthStore] Token刷新成功')
              return true
            } else {
              throw new Error('刷新响应中没有新token')
            }
          } catch (error: any) {
            console.error('[AuthStore] Token刷新失败:', error)
            if (error.response?.status === 401 || (error.message && error.message.includes('401'))) {
              get().clearAuth()
            }
            set({
              error: error.response?.data?.error?.message || error.message || 'Token刷新失败',
              isLoading: false
            })
            return false
          } finally {
            set({ isLoading: false })
          }
        },
        checkTokenExpiration: () => {
          const { token } = get()
          if (!token) {
            return
          }
          if (isTokenExpired(token)) {
            console.log('[AuthStore] Token已过期，清除认证状态')
            get().clearAuth()
            import('../../utils/authRedirect').then(({ handleTokenExpired }) => {
              handleTokenExpired()
            })
            return
          }
          if (shouldRefreshToken(token)) {
            console.log('[AuthStore] Token即将过期，尝试刷新')
            get().refreshTokens()
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          token: state.token,
          refreshToken: state.refreshToken,
          user: state.user,
        }),
        onRehydrateStorage: () => (state) => {
          const token = localStorage.getItem('auth_token')
          const refreshToken = localStorage.getItem('refresh_token')
          if (token && state) {
            state.token = token
            state.refreshToken = refreshToken
            state.isAuthenticated = !!token
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
)
const initializeAuth = () => {
  const { token, checkAuth } = useAuthStore.getState()
  const urlParams = new URLSearchParams(window.location.search)
  const urlAccessToken = urlParams.get('access_token')
  const urlRefreshToken = urlParams.get('refresh_token')
  const urlToken = urlParams.get('token') // 向后兼容旧格式
  if (urlAccessToken && urlRefreshToken) {
    useAuthStore.getState().setTokens(urlAccessToken, urlRefreshToken)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('access_token')
    newUrl.searchParams.delete('refresh_token')
    newUrl.searchParams.delete('token_type')
    window.history.replaceState({}, '', newUrl.toString())
    useAuthStore.getState().fetchCurrentUser()
    startTokenRefreshService()
  } else if (urlToken) {
    useAuthStore.getState().setToken(urlToken)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('token')
    window.history.replaceState({}, '', newUrl.toString())
    useAuthStore.getState().fetchCurrentUser()
    startTokenRefreshService()
  } else if (token) {
    checkAuth()
    startTokenRefreshService()
  }
}
const startTokenRefreshService = () => {
  import('../../services/TokenRefreshService').then(({ tokenRefreshService }) => {
    tokenRefreshService.start()
    console.log('[AuthStore] Token刷新服务已启动')
  })
}
if (typeof window !== 'undefined') {
  initializeAuth()
}
export default useAuthStore
