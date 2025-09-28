'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { getMyOrders, type OrderResponse } from '@/lib/api/orders';
import { getMyReturns, type MyReturn } from '@/lib/api/invoices';

type Row = {
  id: number
  code: string
  created: string
  status: string
  amount: number
}

function map(o: OrderResponse): Row {
  const amount = (o.items || []).reduce((s, it) => s + (it.price ?? 0) * it.quantity, 0)
  return { id: o.id, code: (o.code || '').toUpperCase() || String(o.id), created: new Date(o.createdAt).toISOString().slice(0,10), status: o.status, amount }
}

export default function ReturnTableComponent() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [myReturns, setMyReturns] = useState<MyReturn[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [ordersPage, returnsPage] = await Promise.all([
          getMyOrders(0, 100),
          getMyReturns(0, 100)
        ])
        setRows(ordersPage.content.map(map))
        setMyReturns(returnsPage.content)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeReturnOrderIds = useMemo(() => new Set(myReturns.filter(rt => rt.status !== 'REJECTED').map(rt => rt.orderId)), [myReturns])

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.trim().toLowerCase()
    const okQ = !q || r.code.toLowerCase().includes(q)
    const okS = statusFilter === 'all' || r.status === statusFilter
    const noActiveReturn = !activeReturnOrderIds.has(r.id)
    return okQ && okS && noActiveReturn
  }), [rows, search, statusFilter, activeReturnOrderIds])

  return (
    <div className="p-10 w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Input
          placeholder="Поиск по коду заказа"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Фильтр по статусу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="PENDING">Оформлен</SelectItem>
            <SelectItem value="CONFIRMED">В пути</SelectItem>
            <SelectItem value="CANCELLED">Отменён</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableCaption>Ваши заказы для возврата.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Ref ID</TableHead>
            <TableHead>Фактура/Дата Создания</TableHead>
            <TableHead>Товарный чек</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6}>Загрузка...</TableCell></TableRow>
          ) : filtered.length > 0 ? (
            filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <Link href={`/invoices/${r.id}`} className="text-blue-600 hover:underline">
                    {r.code}
                  </Link>
                </TableCell>
                <TableCell>{r.code} / {r.created}</TableCell>
                <TableCell>—</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{r.created}</TableCell>
                <TableCell className="text-right">{r.amount.toLocaleString()} ₸</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Ничего не найдено
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
