"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';
import { getMyReturns, type MyReturn, type Page } from '@/lib/api/invoices';

export default function ReturnsStatusTable() {
  const [page, setPage] = useState<Page<MyReturn> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const p = await getMyReturns(0, 100)
        setPage(p)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const rows = useMemo(() => page?.content ?? [], [page])

  return (
    <div className="p-6 w-full mx-auto">
      <Table>
        <TableCaption>Статус ваших заявок на возврат.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Заказ</TableHead>
            <TableHead>Причина</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead className="text-right">Сумма (₸)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6}>Загрузка...</TableCell></TableRow>
          ) : rows.length ? rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.orderId}</TableCell>
              <TableCell>{r.reason || '—'}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{new Date(r.createdAt).toISOString().slice(0,10)}</TableCell>
              <TableCell className="text-right">{(Number(r.amount) || 0).toLocaleString()} ₸</TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={6}>Нет заявок на возврат</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

