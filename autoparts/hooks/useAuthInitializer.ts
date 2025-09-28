"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'

export function useAuthInitializer() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return { isLoading }
}
