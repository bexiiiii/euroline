// Локальная история поиска (localStorage) — одна на всё приложение.
// Пишется при каждом выполненном поиске (searchStore), а не только из строки поиска,
// поэтому поиски из шапки, по ссылкам и выбор бренда тоже попадают в историю.

export interface LocalSearchHistoryItem {
  id: string
  query: string
  timestamp: Date
}

const KEY = 'search-history'
const EVENT = 'search-history-changed'
const MAX_ITEMS = 10

export function readSearchHistory(): LocalSearchHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.query === 'string')
      .map((item) => ({ id: String(item.id ?? item.query), query: item.query, timestamp: new Date(item.timestamp) }))
  } catch {
    return []
  }
}

function write(items: LocalSearchHistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // приватный режим / нет доступа к localStorage — история просто не сохранится
  }
}

export function addSearchHistory(query: string) {
  const normalized = query.trim().replace(/\s+/g, ' ')
  if (normalized.length < 3 || typeof window === 'undefined') return
  const rest = readSearchHistory().filter((item) => item.query.toLowerCase() !== normalized.toLowerCase())
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`
  write([{ id, query: normalized, timestamp: new Date() }, ...rest])
}

export function removeSearchHistory(id: string) {
  write(readSearchHistory().filter((item) => item.id !== id))
}

/** Подписка на изменения истории в этой и других вкладках. */
export function subscribeSearchHistory(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) callback() }
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export function clearSearchHistory() {
  write([])
}
