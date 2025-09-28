import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/lib/types/auth'
import { authApi, tokenUtils, ApiError } from '@/lib/api/auth'
import { toast } from 'sonner'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => Promise<void>
  refetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true })
        
        try {
          console.log('Starting login process...')
          const response = await authApi.login({ email, password })
          console.log('Login API response:', response)
          
          console.log('Setting token:', response.jwt)
          tokenUtils.setToken(response.jwt)
          
          // Проверим что токен сохранился
          const savedToken = tokenUtils.getToken()
          console.log('Token after saving:', savedToken ? `${savedToken.substring(0, 20)}...` : 'none')
          
          // Небольшая задержка чтобы убедиться что токен сохранен
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Загружаем данные пользователя
          console.log('Fetching user data...')
          const userData = await authApi.getCurrentUser()
          console.log('User data received:', userData)
          
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          })
          
          toast.success('Вход выполнен успешно!')
          return true
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          
          if (error instanceof ApiError) {
            toast.error(error.message)
          } else {
            toast.error('Ошибка входа')
          }
          return false
        }
      },

      logout: () => {
        tokenUtils.removeToken()
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        })
        toast.success('Выход выполнен успешно')
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      initializeAuth: async () => {
        const token = tokenUtils.getToken()
        if (!token || token.trim() === '') {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
          return
        }

        try {
          const userData = await authApi.getCurrentUser()
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load user:', error)
          // Если токен невалидный, удаляем его
          tokenUtils.removeToken()
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      },

      refetchUser: async () => {
        if (!tokenUtils.getToken()) return

        try {
          const userData = await authApi.getCurrentUser()
          set({ 
            user: userData, 
            isAuthenticated: true 
          })
        } catch (error) {
          console.error('Failed to refetch user:', error)
          get().logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      // Сохраняем только пользователя, остальное инициализируется при загрузке
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
