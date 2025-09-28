"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/lib/types/auth'
import { authApi, tokenUtils, ApiError } from '@/lib/api/auth'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Загрузка пользователя при инициализации
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenUtils.getToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Failed to load user:', error)
        // Если токен невалидный, удаляем его
        tokenUtils.removeToken()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ email, password })
      tokenUtils.setToken(response.jwt)
      
      // Загружаем данные пользователя
      const userData = await authApi.getCurrentUser()
      setUser(userData)
      
      toast.success('Вход выполнен успешно!')
      return true
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Ошибка входа')
      }
      return false
    }
  }

  const logout = () => {
    tokenUtils.removeToken()
    setUser(null)
    toast.success('Выход выполнен успешно')
  }

  const refetchUser = async () => {
    if (!tokenUtils.getToken()) return

    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refetch user:', error)
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
