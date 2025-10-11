import { create } from 'zustand'
import { profileApi, ApiError } from '@/lib/api/profile'
import type {
  UserProfile,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
} from '@/lib/types/profile'
import { toast } from 'sonner'

interface ProfileState {
  profile: UserProfile | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null

  // Actions
  fetchProfile: () => Promise<void>
  updateProfile: (data: UserProfileUpdateRequest) => Promise<boolean>
  changePassword: (data: PasswordChangeRequest) => Promise<boolean>
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  clearError: () => void
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const profile = await profileApi.getCurrentProfile()
      set({ 
        profile, 
        isLoading: false,
        error: null 
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка загрузки профиля'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  updateProfile: async (data: UserProfileUpdateRequest): Promise<boolean> => {
    set({ isUpdating: true, error: null })
    
    try {
      await profileApi.updateProfile(data)
      
      // Обновляем локальное состояние
      const currentProfile = get().profile
      if (currentProfile) {
        set({
          profile: { ...currentProfile, ...data },
          isUpdating: false,
          error: null
        })
      }
      
      toast.success('Профиль успешно обновлен!')
      return true
    } catch (error) {
      console.error('Failed to update profile:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка обновления профиля'
      set({ 
        error: errorMessage, 
        isUpdating: false 
      })
      toast.error(errorMessage)
      return false
    }
  },

  changePassword: async (data: PasswordChangeRequest): Promise<boolean> => {
    set({ isUpdating: true, error: null })
    
    try {
      await profileApi.changePassword(data)
      set({ 
        isUpdating: false,
        error: null 
      })
      toast.success('Пароль успешно изменен!')
      return true
    } catch (error) {
      console.error('Failed to change password:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка изменения пароля'
      set({ 
        error: errorMessage, 
        isUpdating: false 
      })
      toast.error(errorMessage)
      return false
    }
  },

  setProfile: (profile: UserProfile | null) => {
    set({ profile })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  clearError: () => {
    set({ error: null })
  },
}))
