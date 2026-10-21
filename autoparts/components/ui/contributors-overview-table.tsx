"use client"

import { FileText } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

import { useState, useMemo, useEffect } from "react"
import type { RangeValue } from "@react-types/shared"
import type { DateValue } from "@react-types/datepicker"
import { getLocalTimeZone } from "@internationalized/date"
import { CalendarComponent } from "../CalendarComponent"
import { getMyOrders, getWarehouses, type OrderResponse, type WarehouseDTO } from "@/lib/api/orders"
import { useNotificationsStore } from "@/lib/stores/notificationsStore"
import { COMPANY, customerAddressLine, routeUrl } from "@/lib/company"



type UiOrder = {
  id: string
  displayNumber: string
  date: string
  warehouse: string
  warehouseRefKey: string | null
  brand: string
  partCode: string
  description: string
  quantity: number
  price: number
  comment: string
  routeLabel: string
  routeUrl: string | null
  invoiceUrl: string
  status: string
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждён',
  CANCELLED: 'Отменён',
}

function mapStatus(s: string): string {
  return ORDER_STATUS_LABELS[s] ?? s
}

const STATUS_STYLES: Record<string, string> = {
  'Ожидает подтверждения': 'bg-amber-100 text-amber-800',
  'Подтверждён': 'bg-blue-100 text-blue-800',
  'Отменён': 'bg-red-100 text-red-800',
}

// Уникальные непустые значения через запятую, иначе прочерк
const joinUnique = (values: (string | null | undefined)[]) => {
  const unique = Array.from(new Set(values.map((v) => v?.trim()).filter(Boolean) as string[]))
  return unique.length ? unique.join(', ') : '—'
}

// Старые заказы хранили комментарий внутри адреса: "Самовывоз. Комментарий: ..."
const legacyComment = (address?: string) => {
  const marker = 'Комментарий:'
  const idx = address?.indexOf(marker) ?? -1
  return idx >= 0 ? address!.slice(idx + marker.length).trim() : ''
}

function mapOrder(o: OrderResponse): UiOrder {
  const items = o.items || []
  const total = items.reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0)
  const first = items[0]
  const desc = first ? (items.length > 1 ? `${first.productName} и ещё ${items.length - 1}` : first.productName) : '-'
  const destination = customerAddressLine(o.customerCity, o.customerAddress)
  return {
    id: String(o.id),
    displayNumber: (o.code || '').toUpperCase() || String(o.id),
    date: new Date(o.createdAt).toISOString().slice(0,10),
    warehouse: joinUnique(items.map((it) => it.warehouseName)),
    warehouseRefKey: o.warehouseRefKey ?? items.find((it) => it.warehouseRefKey)?.warehouseRefKey ?? null,
    brand: joinUnique(items.map((it) => it.brand)),
    partCode: joinUnique(items.map((it) => it.productCode || it.sku)),
    description: desc,
    quantity: items.reduce((q, it) => q + it.quantity, 0),
    price: total,
    comment: o.comment || o.oneCComment || legacyComment(o.deliveryAddress) || '—',
    routeLabel: destination ? `${COMPANY.city} → ${o.customerCity?.trim() || destination}` : '—',
    routeUrl: destination ? routeUrl(destination) : null,
    invoiceUrl: `/orders/${o.id}/invoice`,
    status: mapStatus(o.status),
  }
}

// Пока 1С не прислала название склада, показываем короткий код вместо полного GUID
const warehouseLabel = (w: WarehouseDTO) => w.name || w.code || `Склад ${w.refKey.slice(0, 8)}`

export default function OrdersTable() {
  const [rawOrders, setOrders] = useState<UiOrder[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { subscribe, unsubscribe } = useNotificationsStore()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const page = await getMyOrders(0, 100)
        setOrders(page.content.map(mapOrder))
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Не удалось загрузить заказы')
      } finally {
        setLoading(false)
      }
    }
    load()
    getWarehouses()
      .then(setWarehouses)
      .catch(() => setWarehouses([]))
    subscribe()
    return () => unsubscribe()
  }, [subscribe, unsubscribe])

  const orders = useMemo(() => {
    const names = new Map(warehouses.map((w) => [w.refKey, warehouseLabel(w)]))
    return rawOrders.map((o) =>
      o.warehouse === '—' && o.warehouseRefKey ? { ...o, warehouse: names.get(o.warehouseRefKey) ?? `Склад ${o.warehouseRefKey.slice(0, 8)}` } : o
    )
  }, [rawOrders, warehouses])

  const totalSum = orders.reduce((acc, order) => acc + order.price, 0)

const [search, setSearch] = useState("")
const [statusFilter, setStatusFilter] = useState("Все")
const [warehouseFilter, setWarehouseFilter] = useState("Все")
const [selectedRange, setSelectedRange] = useState<RangeValue<DateValue> | null>(null)




const filteredOrders = useMemo(() => {
  const timeZone = getLocalTimeZone()
  const startDate = selectedRange?.start
    ? selectedRange.start.toDate(timeZone)
    : null
  const endDate = selectedRange?.end
    ? selectedRange.end.toDate(timeZone)
    : null

  return orders.filter((order) => {
    const matchesSearch =
      order.id.includes(search) ||
      order.displayNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.brand.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "Все" || order.status === statusFilter

    const matchesWarehouse =
      warehouseFilter === "Все" || order.warehouseRefKey === warehouseFilter

    const matchesDate =
      !startDate || !endDate
        ? true
        : new Date(order.date) >= startDate && new Date(order.date) <= endDate

    return matchesSearch && matchesStatus && matchesWarehouse && matchesDate
  })
}, [orders, search, statusFilter, warehouseFilter, selectedRange])




  return (
    <div className="w-full max-w-[1600px] mx-auto overflow-x-auto rounded-xl border bg-gray-100 p-6">
      <h2 className="mb-4 text-xl font-semibold">История заказов</h2>
      {error && (<div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>)}
      <div className="flex flex-wrap gap-4 mb-6">
  <input
    type="text"
    placeholder="Поиск по коду, ID или бренду"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="px-4 py-2 border rounded-md"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="px-4 py-2 border rounded-md"
  >
    <option value="Все">Все статусы</option>
    {Object.values(ORDER_STATUS_LABELS).map((label) => (
      <option key={label} value={label}>{label}</option>
    ))}
  </select>

  <select
    value={warehouseFilter}
    onChange={(e) => setWarehouseFilter(e.target.value)}
    className="px-4 py-2 border rounded-md"
  >
    <option value="Все">Все склады</option>
    {warehouses.map((wh) => (
      <option key={wh.refKey} value={wh.refKey}>{warehouseLabel(wh)}</option>
    ))}
  </select>

  <CalendarComponent
  selectedRange={selectedRange}
  setSelectedRange={setSelectedRange}
/>

{selectedRange && (
  <button
    onClick={() => setSelectedRange(null)}
    className="px-4 py-2 border rounded-md bg-white text-sm hover:bg-gray-100"
  >
    Сбросить даты
  </button>
)}
</div>

      
        <Table>
          <TableHeader>
  <TableRow>
    <TableHead>№ заказа / Дата</TableHead>
    <TableHead>Склад</TableHead>
    <TableHead>Бренд</TableHead>
    <TableHead>Код детали</TableHead>
    <TableHead>Описание</TableHead>
    <TableHead>Заказано</TableHead>
    <TableHead>Сумма, тнг.</TableHead>
    <TableHead>Комментарий</TableHead>
    <TableHead>Статус</TableHead>
    <TableHead>Маршрут</TableHead>
    <TableHead>
      <span className="flex items-center justify-center">
        <FileText size={18} className="text-gray-600" />
      </span>
    </TableHead>
  </TableRow>
</TableHeader>
      <TableBody>
  {filteredOrders.map((order) => (
    <TableRow key={order.id}>
      <TableCell>
        <a href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
          {order.displayNumber}
        </a>
        <br />
        <span className="text-xs text-gray-500">{order.date}</span>
      </TableCell>
      <TableCell>{order.warehouse}</TableCell>
      <TableCell>{order.brand}</TableCell>
      <TableCell>{order.partCode}</TableCell>
      <TableCell>{order.description}</TableCell>
      <TableCell>{order.quantity}</TableCell>
      <TableCell>{order.price.toLocaleString()} ₸</TableCell>
      <TableCell className="max-w-[220px] whitespace-pre-wrap break-words">{order.comment}</TableCell>
      <TableCell>
        <span
          className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
            STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status}
        </span>
      </TableCell>
      <TableCell>
        {order.routeUrl ? (
          <a
            href={order.routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-blue-600 hover:underline"
            title="Открыть маршрут в Яндекс.Картах"
          >
            {order.routeLabel}
          </a>
        ) : (
          <span title="Укажите город и адрес в личном кабинете">{order.routeLabel}</span>
        )}
      </TableCell>
      <TableCell>
        <a
          href={order.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-red-600 hover:text-red-800"
          title="Накладная"
        >
          <FileText size={18} />
        </a>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>
    
    </div>
  )
}
