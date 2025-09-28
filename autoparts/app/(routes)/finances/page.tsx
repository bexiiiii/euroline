"use client"
import { useEffect, useMemo, useState } from "react"
import Breadcrumbs from "@/components/Breadcrumb"
import { FileUploader } from "@/components/FileUploader"
import { Stats } from "@/components/ui/stats-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createMyTopUp, getMyBalance, getMyTopUps, getMyTransactions, uploadMyTopUpReceipt, type BalanceResponse, type FinanceTxn, type TopUp, type PageResponse } from "@/lib/api/finance"
import { toast } from "sonner"
import { CirclePlus } from "lucide-react"

const items = [
  { label: "Главная", href: "/" },
  { label: "Финансы", href: "/finances" },

]


export default function financePage() {
  const [amount, setAmount] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [topUps, setTopUps] = useState<PageResponse<TopUp> | null>(null)
  const [txns, setTxns] = useState<PageResponse<FinanceTxn> | null>(null)
  const [loading, setLoading] = useState(true)

  const fmtKzt = (n: number) => new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(n)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [b, t, x] = await Promise.all([
        getMyBalance(),
        getMyTopUps(0, 20),
        getMyTransactions(0, 50),
      ])
      setBalance(b)
      setTopUps(t)
      setTxns(x)
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось загрузить финансы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleSubmitTopUp = async () => {
    const value = parseInt(amount.replace(/\D/g, ''), 10)
    if (!receipt) {
      toast.error('Пожалуйста, прикрепите чек оплаты')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Введите корректную сумму в тенге')
      return
    }
    setSubmitting(true)
    try {
      const created = await createMyTopUp(value)
      await uploadMyTopUpReceipt(created.id as unknown as number, receipt)
      toast.success('Заявка на пополнение создана')
      setAmount("")
      setReceipt(null)
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка создания заявки')
    } finally {
      setSubmitting(false)
    }
  }

  const totalTopUps = (topUps?.content || []).reduce((sum, t) => sum + (t.status === 'APPROVED' ? (t.amount as unknown as number) : 0), 0)
  const spent = (txns?.content || []).reduce((sum, tx) => {
    const amt = tx.amount as unknown as number
    if (tx.type === 'CHARGE') return sum + amt
    if (amt < 0) return sum + (-amt)
    return sum
  }, 0)
  const remaining = (balance?.balance as unknown as number) || 0

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <main className="container mx-auto px-4 md:px-6">
        <div className="pt-3 md:pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold pt-6 md:pt-8">Финансы</h1>

        <section className="py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Левая колонка: Пополнение */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Пополнение баланса</div>
                  <CirclePlus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2 mb-4">
                  <label className="text-sm text-muted-foreground">Сумма (₸)</label>
                  <Input
                    placeholder="например, 10 000"
                    value={amount}
                    onChange={(e)=>setAmount(e.target.value)}
                    inputMode="numeric"
                  />
                  {amount && (
                    <div className="text-xs text-muted-foreground">К оплате: {fmtKzt(parseInt(amount.replace(/\D/g,'')||'0',10) || 0)}</div>
                  )}
                </div>

                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900 mb-4">
                  Переведите сумму на Kaspi Gold: <span className="font-semibold">+7 706 426 7143</span> или оплатите по QR ниже, затем прикрепите чек.
                </div>

                <div className="flex items-center justify-center mb-4">
                  {/* Замените изображение QR на актуальное */}
                  <img src="/images/payments/kaspi-qr.png" alt="Kaspi QR" className="w-48 h-48 object-contain border rounded" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium">Чек оплаты (изображение или PDF)</div>
                  <FileUploader onFileSelected={setReceipt} />
                </div>

                <Button className="w-full" onClick={handleSubmitTopUp} disabled={submitting || !receipt}>
                  {submitting ? 'Отправка...' : 'Отправить заявку'}
                </Button>
              </div>
            </div>

            {/* Правая колонка: Статистика и таблицы */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border bg-white p-4">
                <Stats totalTopUps={totalTopUps} spent={spent} remaining={remaining} updatedAt={balance?.updatedAt} />
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">История пополнений</h2>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(topUps?.content || []).map(t => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.createdAt).toLocaleString('ru-RU')}</TableCell>
                          <TableCell>{fmtKzt(t.amount as unknown as number)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${t.status==='APPROVED'?'bg-green-50 text-green-700 border border-green-200': t.status==='REJECTED'?'bg-red-50 text-red-700 border border-red-200':'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {t.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!topUps || topUps.content.length===0) && (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Нет данных</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {(txns && txns.content.length > 0) && (
                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">История транзакций</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Дата</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Описание</TableHead>
                          <TableHead className="text-right">Сумма</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txns.content.map(tx => (
                          <TableRow key={tx.id}>
                            <TableCell>{new Date(tx.createdAt).toLocaleString('ru-RU')}</TableCell>
                            <TableCell>{tx.type}</TableCell>
                            <TableCell className="max-w-[420px] truncate">{tx.description}</TableCell>
                            <TableCell className={`text-right ${tx.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmtKzt(tx.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
