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
import { CalendarComponent } from "../CalendarComponent"
import { getMyOrders, type OrderResponse } from "@/lib/api/orders"
import { useNotificationsStore } from "@/lib/stores/notificationsStore"



type UiOrder = {
  id: string
  displayNumber: string
  date: string
  warehouse: string
  brand: string
  partCode: string
  description: string
  quantity: number
  price: number
  comment: string
  route: string
  pdfUrl: string
  status: string
}

function mapStatus(s: string): string {
  switch (s) {
    case 'PENDING': return 'Оформлен'
    case 'CONFIRMED': return 'В пути'
    case 'CANCELLED': return 'Отменён'
    default: return s
  }
}

function mapOrder(o: OrderResponse): UiOrder {
  const total = (o.items || []).reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0)
  const first = o.items?.[0]
  const desc = first ? (o.items.length > 1 ? `${first.productName} и ещё ${o.items.length - 1}` : first.productName) : '-'
  return {
    id: String(o.id),
    displayNumber: (o.code || '').toUpperCase() || String(o.id),
    date: new Date(o.createdAt).toISOString().slice(0,10),
    warehouse: '—',
    brand: '—',
    partCode: '—',
    description: desc,
    quantity: (o.items || []).reduce((q, it) => q + it.quantity, 0),
    price: total,
    comment: '—',
    route: '—',
    pdfUrl: '#',
    status: mapStatus(o.status),
  }
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<UiOrder[]>([])
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
    subscribe()
    return () => unsubscribe()
  }, [subscribe, unsubscribe])

  const totalSum = orders.reduce((acc, order) => acc + order.price, 0)

  const [search, setSearch] = useState("")
const [statusFilter, setStatusFilter] = useState("Все")
const [warehouseFilter, setWarehouseFilter] = useState("Все")
const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null)




const filteredOrders = useMemo(() => {
  return orders.filter((order) => {
    const matchesSearch =
      order.id.includes(search) ||
      order.displayNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.brand.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "Все" || order.status === statusFilter

    const matchesWarehouse =
      warehouseFilter === "Все" || order.warehouse === warehouseFilter

    const matchesDate =
      !selectedRange ||
      (new Date(order.date) >= selectedRange.start &&
       new Date(order.date) <= selectedRange.end)

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
    <option value="Оформлен">Оформлен</option>
    <option value="В пути">В пути</option>
    <option value="Ожидается">Ожидается</option>
    <option value="Доставлен">Доставлен</option>
    <option value="Отменён">Отменён</option>
  </select>

  <select
    value={warehouseFilter}
    onChange={(e) => setWarehouseFilter(e.target.value)}
    className="px-4 py-2 border rounded-md"
  >
    <option value="Все">Все склады</option>
    {[...new Set(orders.map((o) => o.warehouse))].map((wh) => (
      <option key={wh} value={wh}>{wh}</option>
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
      <TableCell>{order.comment}</TableCell>
      <TableCell>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            order.status === "Доставлен"
              ? "bg-green-100 text-green-800"
              : order.status === "В пути"
              ? "bg-blue-100 text-blue-800"
              : order.status === "Ожидается"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {order.status}
        </span>
      </TableCell>
      <TableCell>{order.route}</TableCell>
      <TableCell>
        <a
          href={order.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-red-600 hover:text-red-800"
          title="Скачать PDF"
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
