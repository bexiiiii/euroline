import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE } from "@/lib/api/base"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_ORIGIN = API_BASE.replace(/\/$/, "")

export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_ORIGIN}${normalized}`
}
