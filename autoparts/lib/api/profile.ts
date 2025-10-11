import { API_BASE } from './base'
import type {
  UserProfile,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
} from '@/lib/types/profile'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function authHeader() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token && token.trim() !== ''
    ? { Authorization: `Bearer ${token}` }
    : {}
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...authHeader(),
  }
  try {
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) {
      const msg = await res.text()
      throw new ApiError(res.status, msg || 'Network error')
    }
    const text = await res.text()
    if (!text) return {} as T
    try {
      return JSON.parse(text) as T
    } catch {
      return text as T
    }
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(0, 'Network error')
  }
}

export const profileApi = {
  // Получить профиль текущего пользователя
  async getCurrentProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>(`${API_BASE}/api/profile`)
  },

  // Обновить профиль пользователя
  async updateProfile(data: UserProfileUpdateRequest): Promise<void> {
    return apiRequest<void>(`${API_BASE}/api/profile/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Изменить пароль
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    return apiRequest<void>(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
