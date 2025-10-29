"use client"
import { useEffect, useState } from "react"
import Breadcrumbs from "@/components/Breadcrumb"
import { FileUploader } from "@/components/FileUploader"
import { Stats } from "@/components/ui/stats-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createMyTopUp, getMyBalance, getMyTopUps, getMyTransactions, uploadMyTopUpReceipt, type BalanceResponse, type FinanceTxn, type TopUp, type PageResponse } from "@/lib/api/finance"
import { toast } from "sonner"
import { AlertTriangle, CirclePlus } from "lucide-react"

const items = [
  { label: "Главная", href: "/" },
  { label: "Финансы", href: "/finances" },

]


export default function FinancePage() {
  const [amount, setAmount] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [topUps, setTopUps] = useState<PageResponse<TopUp> | null>(null)
  const [txns, setTxns] = useState<PageResponse<FinanceTxn> | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpsPage, setTopUpsPage] = useState(0)
  const [txnsPage, setTxnsPage] = useState(0)
  const [loadingMoreTopUps, setLoadingMoreTopUps] = useState(false)
  const [loadingMoreTxns, setLoadingMoreTxns] = useState(false)

  const fmtKzt = (n: number) => new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(n)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [b, t, x] = await Promise.all([
        getMyBalance(),
        getMyTopUps(0, 10),
        getMyTransactions(0, 15),
      ])
      setBalance(b)
      setTopUps(t)
      setTxns(x)
      setTopUpsPage(0)
      setTxnsPage(0)
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось загрузить финансы')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreTopUps = async () => {
    if (!topUps || loadingMoreTopUps) return
    setLoadingMoreTopUps(true)
    try {
      const nextPage = topUpsPage + 1
      const moreTopUps = await getMyTopUps(nextPage, 10)
      setTopUps({
        ...moreTopUps,
        content: [...topUps.content, ...moreTopUps.content]
      })
      setTopUpsPage(nextPage)
    } catch (e: any) {
      toast.error('Не удалось загрузить больше пополнений')
    } finally {
      setLoadingMoreTopUps(false)
    }
  }

  const loadMoreTxns = async () => {
    if (!txns || loadingMoreTxns) return
    setLoadingMoreTxns(true)
    try {
      const nextPage = txnsPage + 1
      const moreTxns = await getMyTransactions(nextPage, 15)
      setTxns({
        ...moreTxns,
        content: [...txns.content, ...moreTxns.content]
      })
      setTxnsPage(nextPage)
    } catch (e: any) {
      toast.error('Не удалось загрузить больше транзакций')
    } finally {
      setLoadingMoreTxns(false)
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
      await uploadMyTopUpReceipt(created.id, receipt)
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

  const totalTopUps = (topUps?.content || []).reduce((sum, t) => sum + (t.status === 'APPROVED' ? t.amount : 0), 0)
  const spent = (txns?.content || []).reduce((sum, tx) => {
    const amt = tx.amount
    if (tx.type === 'CHARGE') return sum + amt
    if (amt < 0) return sum + (-amt)
    return sum
  }, 0)
  const remaining = balance?.balance ?? 0
  const creditLimit = balance?.creditLimit ?? 0
  const creditUsed = balance?.creditUsed ?? 0
  const availableCredit = balance?.availableCredit ?? Math.max(creditLimit - creditUsed, 0)
  const qrCodeUrl = balance?.qrCodeUrl || "/images/payments/kaspi-qr.png"
  const hasPersonalQr = Boolean(balance?.qrCodeUrl)

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

                <div
                  className={`mb-4 rounded-lg border p-3 text-sm ${
                    hasPersonalQr
                      ? "border-orange-200 bg-orange-50 text-orange-900"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {hasPersonalQr ? (
                    <>
                      <p>
                        Отсканируйте ваш персональный QR-код ниже и оплатите
                        необходимую сумму.
                      </p>
                      <p className="mt-1">
                        После оплаты прикрепите чек. Пополнение сначала
                        погасит долг по лимиту, затем поступит на баланс.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Для вашего аккаунта пока не закреплён персональный QR-код.
                      </p>
                      <p className="mt-1">
                        Пожалуйста, свяжитесь с менеджером, чтобы получить реквизиты
                        для оплаты.
                      </p>
                    </>
                  )}
                </div>

                {hasPersonalQr && (
                  <div className="mb-4 flex items-center justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="Персональный QR для пополнения"
                      className="h-48 w-48 rounded border object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  </div>
                )}

                <div className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Лимит доступа</span>
                    <span className="font-semibold">{fmtKzt(creditLimit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Использовано лимита</span>
                    <span className="font-semibold text-orange-600">
                      {fmtKzt(creditUsed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Доступно без пополнения</span>
                    <span className="font-semibold text-emerald-600">
                      {fmtKzt(Math.max(availableCredit, 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                 
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
                <Stats
                  totalTopUps={totalTopUps}
                  spent={spent}
                  remaining={remaining}
                  creditLimit={creditLimit}
                  creditUsed={creditUsed}
                  availableCredit={availableCredit}
                  updatedAt={balance?.updatedAt}
                />
              </div>
              <div
                className={`rounded-2xl border p-4 flex items-start gap-3 ${
                  creditUsed > 0
                    ? "border-orange-200 bg-orange-50"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <AlertTriangle
                  className={`mt-1 h-5 w-5 ${
                    creditUsed > 0 ? "text-orange-600" : "text-emerald-600"
                  }`}
                />
                <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {creditUsed > 0 ? (
                    <>
                      <p>
                        Текущий долг по кредитному лимиту:{" "}
                        <span className="font-semibold text-orange-700">
                          {fmtKzt(creditUsed)}
                        </span>
                        .
                      </p>
                      <p>
                        Осталось доступно без пополнения:{" "}
                        <span className="font-semibold text-orange-700">
                          {fmtKzt(Math.max(availableCredit, 0))}
                        </span>
                        . После достижения лимита новые заказы потребуют
                        пополнения счёта.
                      </p>
                    </>
                  ) : (
                    <p>
                      Баланс и кредитный лимит в порядке. Вы можете размещать
                      заказы в пределах установленного лимита{" "}
                      <span className="font-semibold text-emerald-700">
                        {fmtKzt(creditLimit)}
                      </span>
                      .
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">История пополнений</h2>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
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
                {topUps && topUps.totalElements > topUps.content.length && (
                  <div className="flex flex-col items-center gap-2 pt-3 border-t mt-2">
                    <div className="text-xs text-muted-foreground">
                      Показано {topUps.content.length} из {topUps.totalElements} записей
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadMoreTopUps}
                      disabled={loadingMoreTopUps}
                      className="w-full max-w-xs"
                    >
                      {loadingMoreTopUps ? 'Загрузка...' : 'Показать больше'}
                    </Button>
                  </div>
                )}
              </div>

              {(txns && txns.content.length > 0) && (
                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">История транзакций</h2>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
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
                  {txns.totalElements > txns.content.length && (
                    <div className="flex flex-col items-center gap-2 pt-3 border-t mt-2">
                      <div className="text-xs text-muted-foreground">
                        Показано {txns.content.length} из {txns.totalElements} записей
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMoreTxns}
                        disabled={loadingMoreTxns}
                        className="w-full max-w-xs"
                      >
                        {loadingMoreTxns ? 'Загрузка...' : 'Показать больше'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
