"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Printer } from "lucide-react"
import { getMyOrder, type OrderResponse } from "@/lib/api/orders"
import { COMPANY, customerAddressLine } from "@/lib/company"
import { numberToWords, plural, tengeInWords } from "@/lib/amountInWords"

// Накладная на отпуск запасов на сторону, форма З-2
// (приложение 26 к приказу Министра финансов РК от 20.12.2012 № 562).

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })

const VAT_RATE = 0.12 // НДС РК 12%, цены включают НДС

function Blank({ value, className = "" }: { value?: string | null; className?: string }) {
  return <span className={`inline-block min-w-[140px] border-b border-gray-800 px-1 ${className}`}>{value || " "}</span>
}

function Signature({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 text-[11px]">
      <span className="whitespace-nowrap font-medium">{label}</span>
      <div className="flex flex-1 gap-3">
        <div className="flex-1 text-center">
          <div className="h-5 border-b border-gray-800" />
          <span className="text-[9px] text-gray-500">должность</span>
        </div>
        <div className="flex-1 text-center">
          <div className="h-5 border-b border-gray-800" />
          <span className="text-[9px] text-gray-500">подпись</span>
        </div>
        <div className="flex-[1.4] text-center">
          <div className="h-5 border-b border-gray-800" />
          <span className="text-[9px] text-gray-500">расшифровка подписи</span>
        </div>
      </div>
    </div>
  )
}

export default function OrderInvoicePage() {
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.id) return
    getMyOrder(params.id)
      .then(setOrder)
      .catch((e: any) => setError(e?.message || "Не удалось загрузить заказ"))
  }, [params?.id])

  const rows = useMemo(
    () =>
      (order?.items ?? []).map((it, index) => {
        const price = Number(it.price ?? 0)
        const sum = price * it.quantity
        return {
          n: index + 1,
          name: [it.brand, it.productName].filter(Boolean).join(" "),
          code: it.productCode || it.sku || "",
          quantity: it.quantity,
          price,
          sum,
          vat: (sum * VAT_RATE) / (1 + VAT_RATE),
        }
      }),
    [order]
  )

  const totals = useMemo(
    () => rows.reduce((acc, r) => ({ quantity: acc.quantity + r.quantity, sum: acc.sum + r.sum, vat: acc.vat + r.vat }), { quantity: 0, sum: 0, vat: 0 }),
    [rows]
  )

  if (error) {
    return <div className="container mx-auto px-6 pt-32 pb-16 text-red-700">{error}</div>
  }
  if (!order) {
    return <div className="container mx-auto px-6 pt-32 pb-16 text-gray-500">Загрузка накладной...</div>
  }

  if (order.status !== "CONFIRMED") {
    return <div className="container mx-auto px-6 pt-32 pb-16">
      <a href="/order-history" className="text-sm text-blue-600 hover:underline">← История заказов</a>
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        Накладная будет доступна после подтверждения заказа менеджером.
      </p>
    </div>
  }

  const number = (order.code || String(order.id)).toUpperCase()
  const receiver = order.customerName || order.customerEmail || ""
  const receiverAddress = customerAddressLine(order.customerCity, order.customerAddress)
  const comment = order.comment || order.oneCComment

  return (
    <div className="bg-gray-100 min-h-screen pt-24 pb-12 print:bg-white print:p-0">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        @media print {
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; margin: 0; padding: 0; }
        }
      `}</style>

      <div className="mx-auto max-w-[1120px] px-4">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <a href="/order-history" className="text-sm text-blue-600 hover:underline">← История заказов</a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Printer className="h-4 w-4" /> Печать / Сохранить PDF
          </button>
        </div>

        <div id="invoice" className="bg-white p-10 text-gray-900 shadow-sm print:p-0">
          {/* Шапка: логотип и реквизиты продавца */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={COMPANY.logo} alt={COMPANY.name} className="h-12 w-12" />
              <div>
                <div className="text-2xl font-bold tracking-tight">{COMPANY.name}</div>
                <div className="text-xs text-gray-600">Автозапчасти для грузовой и коммерческой техники</div>
              </div>
            </div>
            <div className="text-right text-[11px] leading-5 text-gray-700">
              <div>{COMPANY.address}</div>
              <div>{COMPANY.phone} · {COMPANY.email}</div>
              <div className="mt-1 text-[10px] text-gray-500">
                Приложение 26 к приказу Министра финансов РК от 20 декабря 2012 года № 562
              </div>
              <div className="font-semibold">Форма З-2</div>
            </div>
          </div>

          {/* Организация, БИН, номер и дата */}
          <div className="mt-5 flex items-end justify-between gap-6 text-[12px]">
            <div className="space-y-2">
              <div>Организация (индивидуальный предприниматель): <Blank value={COMPANY.legalName} className="min-w-[260px] font-medium" /></div>
              <div>ИИН/БИН: <Blank value={COMPANY.bin} className="min-w-[180px]" /></div>
            </div>
            <table className="border-collapse text-center text-[11px]">
              <thead>
                <tr>
                  <th className="border border-gray-800 px-3 py-1 font-medium">Номер документа</th>
                  <th className="border border-gray-800 px-3 py-1 font-medium">Дата составления</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 px-3 py-1 font-semibold">{number}</td>
                  <td className="border border-gray-800 px-3 py-1 font-semibold">{formatDate(order.createdAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h1 className="mt-6 text-center text-lg font-bold uppercase tracking-wide">Накладная на отпуск запасов на сторону</h1>

          {/* Отправитель / получатель */}
          <table className="mt-4 w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-800 px-2 py-1 font-medium">Организация (ИП) — отправитель</th>
                <th className="border border-gray-800 px-2 py-1 font-medium">Организация (ИП) — получатель</th>
                <th className="border border-gray-800 px-2 py-1 font-medium">Ответственный за поставку (Ф.И.О.)</th>
                <th className="border border-gray-800 px-2 py-1 font-medium">Транспортная организация</th>
                <th className="border border-gray-800 px-2 py-1 font-medium">Товарно-транспортная накладная (номер, дата)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border border-gray-800 px-2 py-2">{COMPANY.legalName}<div className="text-gray-600">{COMPANY.address}</div></td>
                <td className="border border-gray-800 px-2 py-2">
                  {receiver}
                  {receiverAddress && <div className="text-gray-600">{receiverAddress}</div>}
                  {order.customerPhone && <div className="text-gray-600">{order.customerPhone}</div>}
                </td>
                <td className="border border-gray-800 px-2 py-2" />
                <td className="border border-gray-800 px-2 py-2">{order.deliveryAddress?.startsWith("Самовывоз") ? "Самовывоз" : ""}</td>
                <td className="border border-gray-800 px-2 py-2" />
              </tr>
            </tbody>
          </table>

          {/* Табличная часть, графы 1–9 */}
          <table className="mt-4 w-full border-collapse text-[11px]">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="border border-gray-800 px-1 py-1 font-medium">Номер по порядку</th>
                <th rowSpan={2} className="border border-gray-800 px-2 py-1 font-medium">Наименование, характеристика</th>
                <th rowSpan={2} className="border border-gray-800 px-2 py-1 font-medium">Номенклатурный номер</th>
                <th rowSpan={2} className="border border-gray-800 px-1 py-1 font-medium">Единица измерения</th>
                <th colSpan={2} className="border border-gray-800 px-2 py-1 font-medium">Количество</th>
                <th rowSpan={2} className="border border-gray-800 px-2 py-1 font-medium">Цена за единицу, в тенге</th>
                <th rowSpan={2} className="border border-gray-800 px-2 py-1 font-medium">Сумма с НДС, в тенге</th>
                <th rowSpan={2} className="border border-gray-800 px-2 py-1 font-medium">Сумма НДС, в тенге</th>
              </tr>
              <tr>
                <th className="border border-gray-800 px-2 py-1 font-medium">подлежит отпуску</th>
                <th className="border border-gray-800 px-2 py-1 font-medium">отпущено</th>
              </tr>
              <tr className="text-[10px] text-gray-600">
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} className="border border-gray-800 py-0.5 font-normal">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n}>
                  <td className="border border-gray-800 px-1 py-1 text-center">{r.n}</td>
                  <td className="border border-gray-800 px-2 py-1">{r.name}</td>
                  <td className="border border-gray-800 px-2 py-1 font-mono">{r.code}</td>
                  <td className="border border-gray-800 px-1 py-1 text-center">шт.</td>
                  <td className="border border-gray-800 px-2 py-1 text-right">{r.quantity}</td>
                  <td className="border border-gray-800 px-2 py-1 text-right" />
                  <td className="border border-gray-800 px-2 py-1 text-right">{money(r.price)}</td>
                  <td className="border border-gray-800 px-2 py-1 text-right">{money(r.sum)}</td>
                  <td className="border border-gray-800 px-2 py-1 text-right">{money(r.vat)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={4} className="border border-gray-800 px-2 py-1 text-right">Итого</td>
                <td className="border border-gray-800 px-2 py-1 text-right">{totals.quantity}</td>
                <td className="border border-gray-800 px-2 py-1" />
                <td className="border border-gray-800 px-2 py-1 text-center">x</td>
                <td className="border border-gray-800 px-2 py-1 text-right">{money(totals.sum)}</td>
                <td className="border border-gray-800 px-2 py-1 text-right">{money(totals.vat)}</td>
              </tr>
            </tbody>
          </table>

          {/* Итоги прописью */}
          <div className="mt-4 space-y-1 text-[12px]">
            <div>
              Всего отпущено количество запасов (прописью):{" "}
              <span className="font-medium underline decoration-gray-400 underline-offset-4">
                {numberToWords(totals.quantity, true)} {plural(totals.quantity, ["единица", "единицы", "единиц"])}
              </span>
            </div>
            <div>
              на сумму (прописью), в тенге:{" "}
              <span className="font-medium underline decoration-gray-400 underline-offset-4">{tengeInWords(totals.sum)}</span>
              <span className="text-gray-600">, в том числе НДС {money(totals.vat)} тенге</span>
            </div>
            {comment && <div className="text-gray-700">Комментарий к заказу: {comment}</div>}
          </div>

          {/* Подписи */}
          <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-5">
              <Signature label="Отпуск разрешил" />
              <div className="flex items-end gap-2 text-[11px]">
                <span className="whitespace-nowrap font-medium">Главный бухгалтер</span>
                <div className="flex flex-1 gap-3">
                  <div className="flex-1 text-center"><div className="h-5 border-b border-gray-800" /><span className="text-[9px] text-gray-500">подпись</span></div>
                  <div className="flex-[1.4] text-center"><div className="h-5 border-b border-gray-800" /><span className="text-[9px] text-gray-500">расшифровка подписи</span></div>
                </div>
              </div>
              <div className="pt-2 text-[11px] font-semibold">М.П.</div>
              <Signature label="Отпустил" />
            </div>
            <div className="space-y-5 text-[11px]">
              <div>По доверенности № <Blank className="min-w-[80px]" /> от «<Blank className="min-w-[30px]" />» <Blank className="min-w-[90px]" /> 20<Blank className="min-w-[24px]" /> года</div>
              <div>выданной <Blank className="min-w-[320px]" /></div>
              <Signature label="Запасы получил" />
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-3 text-center text-[10px] text-gray-400">
            Сформировано на сайте {COMPANY.name} · заказ {number}
          </div>
        </div>
      </div>
    </div>
  )
}
