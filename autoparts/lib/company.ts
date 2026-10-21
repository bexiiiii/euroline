// Реквизиты продавца для документов (накладная) и маршрута.
// БИН и банковские реквизиты пока не заданы — в документе остаётся пустая строка для заполнения.
export const COMPANY = {
  name: 'Euroline',
  legalName: 'Euroline',
  bin: '',
  city: 'Алматы',
  address: 'г. Алматы, пр. Суюнбая 2, к. 4',
  phone: '+7 727 330 75 52',
  email: 'cc@euroline.com.kz',
  logo: '/euroline-logo.png',
} as const

const routeAddress = (city?: string | null, address?: string | null) =>
  [city, address].map((part) => part?.trim()).filter(Boolean).join(', ')

/** Адрес клиента одной строкой: "город, адрес". Пусто, если ничего не указано. */
export function customerAddressLine(city?: string | null, address?: string | null): string {
  return routeAddress(city, address)
}

/** Ссылка на маршрут в Яндекс.Картах от нашего склада до адреса клиента. */
export function routeUrl(customerAddress: string): string {
  const rtext = `${encodeURIComponent(COMPANY.address)}~${encodeURIComponent(customerAddress)}`
  return `https://yandex.kz/maps/?rtext=${rtext}&rtt=auto`
}
