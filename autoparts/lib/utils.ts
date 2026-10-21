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

// Фото товара: абсолютный URL как есть; относительные пути картинок UMAPI
// ("/4420/<hash>.webp" или "/IMAGE/...") — на image.umapi.ru; остальное — наши файлы.
const UMAPI_IMAGE_PATH = /^\/\d+\/[0-9a-f]+\.(webp|jpe?g|png|gif)$/i

export function resolveProductImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith("/IMAGE/")) return `https://image.umapi.ru${path}`
  if (UMAPI_IMAGE_PATH.test(path)) return `https://image.umapi.ru/IMAGE${path}`
  return resolveAssetUrl(path)
}
