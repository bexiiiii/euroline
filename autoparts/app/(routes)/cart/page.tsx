"use client"
import Breadcrumbs from "@/components/Breadcrumb";
import CartTable from "@/components/CartTableComponent";
import { GetStartedButton } from "@/components/ui/get-started-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import { getMyBalance } from "@/lib/api/finance";
import { createOrder } from "@/lib/api/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const items = [
  { label: "Главная", href: "/" },
  { label: "Корзина", isCurrent: true },
];

function Cart() {
  const router = useRouter()
  const { items } = useCartStore()
  const total = useMemo(() => items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0), [items])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'check'|'insufficient'|'confirm'>('check')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setOpen(true)
    setMode('check')
    try {
      const bal = await getMyBalance()
      const balNum = (bal as any)?.balance ?? 0
      if (Number(balNum) >= total) {
        setMode('confirm')
      } else {
        setMode('insufficient')
      }
    } catch (e: any) {
      setOpen(false)
      toast.error(e?.message || 'Не удалось проверить баланс')
    }
  }

  const handleCreate = async () => {
    try {
      setLoading(true)
      const key = (globalThis.crypto && (globalThis.crypto as any).randomUUID) ? (globalThis.crypto as any).randomUUID() : `order-${Date.now()}`
      const address = `Самовывоз. ${comment ? 'Комментарий: ' + comment : ''}`.slice(0, 480)
      await createOrder(address, key)
      toast.success('Заказ создан')
      setOpen(false)
      router.push('/order-history')
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка создания заказа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>

        <h1 className="text-4xl font-bold pt-4">Корзина</h1>
        <section className="bg-gray-100 p-6 rounded-lg mt-6">
            
            <CartTable />
            <div className="mt-4 flex justify-end pr-4">
              <div onClick={handleCheckout}>
                <GetStartedButton label="оформить заказ" />
              </div>
            </div>
        </section>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            {mode === 'check' && (
              <div className="py-6 text-center">Проверка баланса...</div>
            )}
            {mode === 'insufficient' && (
              <>
                <DialogHeader>
                  <DialogTitle>Недостаточно средств</DialogTitle>
                  <DialogDescription>
                    На вашем балансе недостаточно средств для оформления заказа. Пополните баланс и повторите попытку.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Закрыть</Button>
                  <Button onClick={() => router.push('/finances')}>Пополнить баланс</Button>
                </DialogFooter>
              </>
            )}
            {mode === 'confirm' && (
              <>
                <DialogHeader>
                  <DialogTitle>Подтверждение заказа</DialogTitle>
                  <DialogDescription>
                    Сумма к оплате: {total.toLocaleString()} ₸
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2">Комментарий (опционально)</label>
                  <Textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Напишите комментарий к заказу" />
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                  <Button onClick={handleCreate} disabled={loading}>{loading ? 'Создание...' : 'Продолжить'}</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default Cart;
        
