"use client"

import { useAuthInitializer } from '@/hooks/useAuthInitializer'

export function AuthInitializer() {
  useAuthInitializer()
  return null
}
