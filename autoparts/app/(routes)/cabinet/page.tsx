'use client'

import Breadcrumbs from "@/components/Breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useState } from "react"
import { profileApi } from "@/lib/api/profile"
import type { UserProfile } from "@/lib/types/profile"
import { getMyOrders, type OrderResponse } from "@/lib/api/orders"
import { getMyBalance, getMyTransactions, type FinanceTxn } from "@/lib/api/finance"
import Link from "next/link"

const breadcrumbItems = [
  { label: "Главная", href: "/" },
  { label: "Личный кабинет", isCurrent: true },
]

type UiOrder = {
  id: number
  code: string
  date: string
  total: number
  qty: number
}

function mapOrder(o: OrderResponse): UiOrder {
  const total = (o.items || []).reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0)
  const qty = (o.items || []).reduce((q, it) => q + it.quantity, 0)
  return {
    id: o.id,
    code: (o.code || '').toUpperCase() || String(o.id),
    date: new Date(o.createdAt).toISOString().slice(0,10),
    total,
    qty,
  }
}

export default function CabinetPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<UiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<number>(0)
  const [spent, setSpent] = useState<number>(0)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [p, page, bal, txPage] = await Promise.all([
          profileApi.getCurrentProfile().catch(() => null),
          getMyOrders(0, 20).catch(() => ({ content: [] as OrderResponse[] })),
          getMyBalance().catch(() => ({ balance: 0 } as any)),
          getMyTransactions(0, 100).catch(() => ({ content: [] as FinanceTxn[] }))
        ])
        setProfile(p as UserProfile | null)
        const confirmed = (page.content || []).filter(o => o.status === 'CONFIRMED').slice(0,5)
        setOrders(confirmed.map(mapOrder))
        const balNum = Number((bal as any)?.balance ?? 0)
        setBalance(isNaN(balNum) ? 0 : balNum)
        const chargeSum = (txPage.content || [])
          .filter((t: FinanceTxn)=> t.type === 'CHARGE')
          .reduce((s: number, t: FinanceTxn)=> s + Number(t.amount || 0), 0)
        const fallbackOrders = confirmed
          .reduce((s, o)=> s + (o.items||[])
            .reduce((ss,it)=> ss + Number(it.price ?? 0) * Number(it.quantity ?? 0), 0), 0)
        setSpent(chargeSum > 0 ? chargeSum : fallbackOrders)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const fullName = useMemo(() => [profile?.surname, profile?.name, profile?.fathername].filter(Boolean).join(' '), [profile])

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5 pb-6">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-4xl font-bold text-gray-900 pt-4">Личный кабинет</h1>
          <p className="text-gray-600 mt-2">Ваш профиль и последние принятые заказы</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Личные данные */}
          <Card className="lg:col-span-2 bg-gray-50 border-gray-200">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Личные данные</CardTitle>
              <CardDescription>Информация вашего профиля</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Фамилия</label>
                  <input readOnly value={profile?.surname ?? ''} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Имя</label>
                  <input readOnly value={profile?.name ?? ''} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Отчество</label>
                  <input readOnly value={profile?.fathername ?? ''} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Телефон</label>
                  <input readOnly value={profile?.phone ?? ''} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Адрес</label>
                  <input readOnly value={profile?.officeAddress ?? ''} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Быстрая сводка */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Сводка</CardTitle>
              <CardDescription>{fullName || '—'}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>E-mail</span><span>{profile?.email || '—'}</span></div>
              <div className="flex justify-between"><span>Клиент</span><span>{profile?.clientName || '—'}</span></div>
              <div className="flex justify-between"><span>Город</span><span>{profile?.city || '—'}</span></div>
              <div className="flex justify-between"><span>Тип</span><span>{profile?.type || '—'}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Баланс */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="border-b"><CardTitle>Баланс</CardTitle></CardHeader>
            <CardContent className="pt-4 text-2xl font-semibold">{balance.toLocaleString()} ₸</CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="border-b"><CardTitle>Потрачено</CardTitle></CardHeader>
            <CardContent className="pt-4 text-2xl font-semibold text-red-700">{spent.toLocaleString()} ₸</CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="border-b"><CardTitle>Остаток</CardTitle></CardHeader>
            <CardContent className="pt-4 text-2xl font-semibold text-green-700">{Math.max(0, balance - spent).toLocaleString()} ₸</CardContent>
          </Card>
        </div>

        {/* Последние принятые заказы */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Последние принятые заказы</h2>
          <div className="">
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-4">
                {orders.length === 0 ? (
                  <div className="py-8 text-gray-600">Нет принятых заказов</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 px-3">Заказ</th>
                          <th className="py-2 px-3">Дата</th>
                          <th className="py-2 px-3">Позиции</th>
                          <th className="py-2 px-3">Сумма</th>
                          <th className="py-2 px-3">Маршрут</th>
                          <th className="py-2 px-3">Договоренность</th>
                          <th className="py-2 px-3">Способ получения</th>
                          <th className="py-2 px-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id} className="border-t">
                            <td className="py-2 px-3 font-medium">#{o.code}</td>
                            <td className="py-2 px-3">{o.date}</td>
                            <td className="py-2 px-3">{o.qty}</td>
                            <td className="py-2 px-3">{o.total.toLocaleString()} ₸</td>
                            <td className="py-2 px-3">{computeRoute(profile, (o as any).address || '')}</td>
                            <td className="py-2 px-3">—, 100% Предоплата</td>
                            <td className="py-2 px-3">{formatOrderDelivery((o as any).address || '', (o as any).createdAtISO)}</td>
                            <td className="py-2 px-3"><Link href={`/orders/${o.id}`} className="text-green-700 hover:text-green-800 font-medium">Открыть →</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// Вспомогательные функции отображения маршрута и способа получения
const ORIGIN_CITY = 'Алматы'

function computeRoute(profile: UserProfile | null, address: string): string {
  const dest = extractCity(address) || profile?.city || '—'
  return dest === '—' ? '—' : `${ORIGIN_CITY} - ${dest}`
}

function extractCity(address?: string): string | null {
  if (!address) return null
  // попытка вытащить "г. <Город>" или второе поле до запятой
  const m = address.match(/г\.?\s*([A-Za-zА-Яа-яЁё\-\s]+)/)
  if (m && m[1]) return m[1].trim()
  const parts = address.split(',').map(s=>s.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[1] // часто формат: область, г. <город>, ...
  return null
}

function formatDelivery(profile: UserProfile | null): string {
  const addr = profile?.officeAddress || ''
  const time = new Date().toTimeString().slice(0,5)
  if (addr) return `Доставка, ${addr}  ${time}`
  return 'Самовывоз'
}

function formatOrderDelivery(address: string, createdAtISO: string){
  const time = (()=>{ try { return new Date(createdAtISO).toTimeString().slice(0,5) } catch { return '' } })()
  if (address && address.trim().length>0) return `Доставка, ${extractCity(address) || address} ${time}`
  return 'Самовывоз'
}
