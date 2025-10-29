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
  const { items: cartItems } = useCartStore()
  const total = useMemo(() => cartItems.reduce((s, it) => s + (it.price || 0) * it.quantity, 0), [cartItems])
  const hasItems = cartItems.length > 0

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'check'|'insufficient'|'confirm'>('check')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [balanceInfo, setBalanceInfo] = useState<{ balance: number; availableCredit: number; totalAvailable: number } | null>(null)

  const handleCheckout = async () => {
    if (!hasItems) {
      toast.error('Добавьте товары в корзину для оформления заказа')
      return
    }
    
    setOpen(true)
    setMode('check')
    try {
      const bal = await getMyBalance()
      const balance = Number(bal?.balance ?? 0)
      const availableCredit = Number(bal?.availableCredit ?? 0)
      const totalAvailable = balance + availableCredit
      
      setBalanceInfo({ balance, availableCredit, totalAvailable })
      
      if (totalAvailable >= total) {
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
              <GetStartedButton 
                label="оформить заказ" 
                onClick={handleCheckout}
                disabled={!hasItems}
              />
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
                    На вашем балансе недостаточно средств для оформления заказа.
                  </DialogDescription>
                </DialogHeader>
                {balanceInfo && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Сумма заказа:</span>
                      <span className="font-semibold text-slate-900">{total.toLocaleString()} ₸</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ваш баланс:</span>
                      <span className="font-semibold text-slate-900">{balanceInfo.balance.toLocaleString()} ₸</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Доступный кредит:</span>
                      <span className="font-semibold text-emerald-600">{balanceInfo.availableCredit.toLocaleString()} ₸</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Всего доступно:</span>
                        <span className="font-bold text-slate-900">{balanceInfo.totalAvailable.toLocaleString()} ₸</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-red-600 font-semibold">
                      <span>Не хватает:</span>
                      <span>{Math.max(0, total - balanceInfo.totalAvailable).toLocaleString()} ₸</span>
                    </div>
                  </div>
                )}
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
                  <Button onClick={handleCreate} disabled={loading}>{loading ? 'Создание...' : 'Подтвердить заказ'}</Button>
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
        
