import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/lib/types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Добавляем токен только если он есть и не пустой
  const token = localStorage.getItem('authToken')
  console.log('API Request:', endpoint, 'Token:', token ? `${token.substring(0, 20)}...` : 'none')
  
  if (token && token.trim() !== '') {
    defaultHeaders.Authorization = `Bearer ${token}`
    console.log('Added Authorization header with token')
  } else {
    console.log('No token found, skipping Authorization header')
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  console.log('Request headers:', config.headers)

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorMessage = await response.text()
      throw new ApiError(response.status, errorMessage || 'Network error')
    }

    // Если ответ пустой, возвращаем пустой объект
    const text = await response.text()
    if (!text) {
      return {} as T
    }

    try {
      return JSON.parse(text) as T
    } catch {
      // Если не JSON, возвращаем текст
      return text as T
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, 'Network error')
  }
}

export const authApi = {
  // Авторизация
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    console.log('Login response:', response)
    return response
  },

  // Регистрация
  async register(data: RegisterRequest): Promise<string> {
    // Убираем confirmPassword перед отправкой
    const { confirmPassword, ...registerData } = data
    
    console.log('Sending registration data:', registerData) // Добавим логирование
    
    return apiRequest<string>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(registerData),
    })
  },

  // Проверка токена и получение данных пользователя
  async getCurrentUser(): Promise<User> {
    // Получаем токен еще раз для актуальности
    const token = tokenUtils.getToken()
    if (!token) {
      throw new ApiError(401, 'No authentication token found')
    }
    
    return apiRequest<User>('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },
}

// Утилиты для работы с токеном
export const tokenUtils = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('authToken')
    console.log('Getting token from localStorage:', token ? `${token.substring(0, 20)}...` : 'none')
    return token && token.trim() !== '' ? token : null
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return
    if (token && token.trim() !== '') {
      console.log('Setting token to localStorage:', `${token.substring(0, 20)}...`)
      localStorage.setItem('authToken', token)
    }
  },

  removeToken(): void {
    if (typeof window === 'undefined') return
    console.log('Removing token from localStorage')
    localStorage.removeItem('authToken')
  },

  isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token
  },
}

export { ApiError }
