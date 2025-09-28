"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";

type Row = {
  id: number;
  image?: string;
  brand?: string;
  article?: string;
  name?: string;
  quantity: number;
  price: number;
}

export default function CartTable() {
  const { items, isLoading, error, load, setQty, remove, clearError } = useCartStore()

  useEffect(() => { load() }, [load])

  const rows: Row[] = items
  const loading = isLoading
  const total = useMemo(() => rows.reduce((sum, p) => sum + p.price * p.quantity, 0), [rows])

  const handleQuantityChange = async (id: number, delta: number) => {
    const current = rows.find(r => r.id === id)
    if (!current) return
    const nextQty = Math.max(current.quantity + delta, 0)
    await setQty(id, nextQty)
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button className="text-red-700 underline" onClick={clearError}>закрыть</button>
        </div>
      )}
      {loading ? (
        <div className="py-16 text-center text-gray-500">Загрузка...</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
          <ShoppingCart className="w-12 h-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-800">Корзина пуста</h3>
          <p className="mt-1 text-sm text-gray-500">Добавьте товары из каталога, чтобы оформить заказ.</p>
        </div>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Фото</TableHead>
            <TableHead>Бренд</TableHead>
            <TableHead>Артикул</TableHead>
            <TableHead>Наименование</TableHead>
            <TableHead>Кол-во</TableHead>
            <TableHead>Склад</TableHead>
            <TableHead>Постав.</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Image
                  src={product.image || 'https://via.placeholder.com/64'}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="rounded object-cover w-16 h-16"
                />
              </TableCell>
              <TableCell>{product.brand}</TableCell>
              <TableCell>{product.article}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-6 text-center">{product.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>{product.price.toLocaleString()} ₸</TableCell>
              <TableCell>{(product.price * product.quantity).toLocaleString()} ₸</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={9} className="text-right font-bold">
              Общая сумма:
            </TableCell>
            <TableCell className="font-bold">
              {total.toLocaleString()} ₸
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      )}
    </div>
  );
}
