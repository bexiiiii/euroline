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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import type { InvoiceItem } from '@/lib/api/invoices';

export type UiItem = InvoiceItem & { toReturn: number }

export default function ReturnTableComponent({
  items,
  onChange,
}: {
  items: InvoiceItem[];
  onChange?: (items: UiItem[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [stateItems, setStateItems] = useState<UiItem[]>(items.map(i => ({ ...i, toReturn: 0 })));

  const setToReturn = (itemId: number, val: number) => {
    setStateItems(prev => {
      const next = prev.map(it => it.itemId === itemId ? { ...it, toReturn: Math.max(0, Math.min(it.quantity, val)) } : it)
      onChange?.(next)
      return next
    })
  }

  const increment = (itemId: number) => {
    const it = stateItems.find(i => i.itemId === itemId); if (!it) return
    setToReturn(itemId, it.toReturn + 1)
  }
  const decrement = (itemId: number) => {
    const it = stateItems.find(i => i.itemId === itemId); if (!it) return
    setToReturn(itemId, it.toReturn - 1)
  }

  const filteredItems = useMemo(() => stateItems.filter((item) =>
    item.article.toLowerCase().includes(search.toLowerCase()) ||
    item.brand.toLowerCase().includes(search.toLowerCase()) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  ), [stateItems, search])

  const totalSum = filteredItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalToReturn = filteredItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.toReturn || 0), 0);

  return (
    <div className="p-10 w-full mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm space-y-1">
          <p><strong>Сумма продажи:</strong> {totalSum.toLocaleString()} ₸</p>
          <p><strong>Сумма к возврату:</strong> {totalToReturn.toLocaleString()} ₸</p>
        </div>
        <Input
          placeholder="Поиск по артикулу, бренду или названию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Table>
        <TableCaption>Список позиций для возврата.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Позиция</TableHead>
            <TableHead>Артикул</TableHead>
            <TableHead>Бренд</TableHead>
            <TableHead>Наименование</TableHead>
            <TableHead>Цена (₸)</TableHead>
            <TableHead>Кол-во</TableHead>
            <TableHead>Сумма (₸)</TableHead>
            <TableHead>Возвращено</TableHead>
            <TableHead>Доступно до</TableHead>
            <TableHead>К возврату</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item, idx) => (
            <TableRow key={item.itemId}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{item.article}</TableCell>
              <TableCell>{item.brand}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{Number(item.price).toLocaleString()}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{Number(item.total).toLocaleString()}</TableCell>
              <TableCell>{item.returned}</TableCell>
              <TableCell>{item.returnDeadline}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => decrement(item.itemId)}>-</Button>
                  <Input
                    type="number"
                    className="w-16 h-8 text-center"
                    value={item.toReturn}
                    min={0}
                    max={item.quantity}
                    onChange={(e) => setToReturn(item.itemId, parseInt(e.target.value) || 0)}
                  />
                  <Button size="sm" variant="outline" onClick={() => increment(item.itemId)}>+</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
