"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { CheckCircle2, Loader2, QrCode, Smartphone, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cancelKaspiTopUp,
  createKaspiInvoice,
  createKaspiQr,
  getKaspiAvailability,
  getKaspiTopUp,
  type KaspiAvailability,
  type KaspiTopUp,
} from "@/lib/api/finance"

type Mode = "QR" | "INVOICE"

const ACTIVE_KEY = "kaspiActiveTopUpId"
const POLL_MS = 3000

const fmtKzt = (n: number) =>
  new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(n)

const digits = (s: string) => s.replace(/\D/g, "")

/** "7071234567" → "+7 707 123 45 67" */
const fmtPhone = (raw: string) => {
  const d = digits(raw).slice(0, 10)
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean)
  return parts.length ? `+7 ${parts.join(" ")}` : ""
}

const storage = {
  get(): number | null {
    try {
      const v = sessionStorage.getItem(ACTIVE_KEY)
      return v ? Number(v) : null
    } catch {
      return null
    }
  },
  set(id: number | null) {
    try {
      if (id == null) sessionStorage.removeItem(ACTIVE_KEY)
      else sessionStorage.setItem(ACTIVE_KEY, String(id))
    } catch {
      /* ignore */
    }
  },
}

function useCountdown(expiresAt?: string | null) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (!expiresAt) {
      setLeft(null)
      return
    }
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  return left
}

/**
 * Пополнение баланса через Kaspi: QR-код (Kaspi или приложение любого банка) или счёт на номер телефона.
 * Баланс зачисляет сервер после того, как сам проверит оплату в Kaspi.
 */
export function KaspiTopUpCard({ onPaid }: { onPaid?: () => void }) {
  const [availability, setAvailability] = useState<KaspiAvailability | null>(null)
  const [mode, setMode] = useState<Mode>("QR")
  const [amount, setAmount] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [active, setActive] = useState<KaspiTopUp | null>(null)
  const notified = useRef<number | null>(null)
  const secondsLeft = useCountdown(active?.type === "QR" && active.status === "PENDING" ? active.expiresAt : null)

  useEffect(() => {
    getKaspiAvailability().then(setAvailability).catch(() => setAvailability(null))
    const saved = storage.get()
    if (saved) {
      getKaspiTopUp(saved)
        .then((t) => (t.status === "PENDING" ? setActive(t) : storage.set(null)))
        .catch(() => storage.set(null))
    }
  }, [])

  const applyUpdate = useCallback(
    (t: KaspiTopUp) => {
      setActive(t)
      if (t.status === "PENDING" || notified.current === t.id) return
      notified.current = t.id
      storage.set(null)
      if (t.status === "APPROVED") {
        toast.success(`Оплата ${fmtKzt(t.amount)} получена, баланс пополнен`)
        onPaid?.()
      } else {
        toast.error(t.kaspiStatus ? `Платёж не прошёл: ${t.kaspiStatus}` : "Платёж не прошёл")
      }
    },
    [onPaid],
  )

  // poll our backend (which verifies the payment with Kaspi) while the payment is pending
  useEffect(() => {
    if (!active || active.status !== "PENDING") return
    const id = active.id
    const t = setInterval(() => {
      getKaspiTopUp(id).then(applyUpdate).catch(() => {})
    }, POLL_MS)
    return () => clearInterval(t)
  }, [active?.id, active?.status, applyUpdate])

  if (!availability?.available) return null

  const value = parseInt(digits(amount) || "0", 10)
  const amountError =
    value && value < availability.minAmount
      ? `Минимум ${fmtKzt(availability.minAmount)}`
      : value > availability.maxAmount
        ? `Максимум ${fmtKzt(availability.maxAmount)}`
        : null
  const phoneOk = /^7\d{9}$/.test(phone)
  const canSubmit = !submitting && value > 0 && !amountError && (mode === "QR" || phoneOk)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const t = mode === "QR" ? await createKaspiQr(value) : await createKaspiInvoice(value, phone)
      notified.current = null
      storage.set(t.id)
      setActive(t)
      if (mode === "INVOICE") toast.success("Счёт отправлен в Kaspi")
    } catch (e: any) {
      toast.error(e?.message || "Не удалось создать платёж")
    } finally {
      setSubmitting(false)
    }
  }

  const cancel = async () => {
    if (!active) return
    try {
      applyUpdate(await cancelKaspiTopUp(active.id))
    } catch (e: any) {
      toast.error(e?.message || "Не удалось отменить счёт")
    }
  }

  const reset = () => {
    storage.set(null)
    setActive(null)
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Пополнение через Kaspi</div>
        <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Kaspi.kz</span>
      </div>

      {!active && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 text-sm">
            {(["QR", "INVOICE"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition ${
                  mode === m ? "bg-white font-medium shadow-sm" : "text-slate-600"
                }`}
              >
                {m === "QR" ? <QrCode className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                {m === "QR" ? "QR-код" : "Счёт на телефон"}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <label className="text-sm text-muted-foreground">Сумма (₸)</label>
            <Input
              placeholder="например, 10 000"
              value={amount}
              onChange={(e) => setAmount(digits(e.target.value))}
              inputMode="numeric"
            />
            {amountError && <div className="text-xs text-red-600">{amountError}</div>}
          </div>

          {mode === "INVOICE" && (
            <div className="space-y-2 mb-4">
              <label className="text-sm text-muted-foreground">Номер телефона в Kaspi</label>
              <Input
                placeholder="+7 7XX XXX XX XX"
                value={fmtPhone(phone)}
                onChange={(e) => {
                  // the shown value carries a "+7" prefix; strip it (or a pasted 8/7 country code) to keep 10 digits
                  let d = digits(e.target.value)
                  if (e.target.value.trim().startsWith("+7")) d = d.slice(1)
                  else if (d.length === 11 && /^[78]/.test(d)) d = d.slice(1)
                  setPhone(d.slice(0, 10))
                }}
                inputMode="tel"
              />
              <div className="text-xs text-muted-foreground">
                Счёт придёт в приложение Kaspi.kz этого номера. Можно указать любой номер.
              </div>
            </div>
          )}

          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {mode === "QR"
              ? "Отсканируйте QR-код в Kaspi.kz или в приложении другого банка. Баланс пополнится автоматически после оплаты."
              : "Оплатите счёт в Kaspi.kz. Баланс пополнится автоматически после оплаты."}{" "}
            Сначала погашается долг по лимиту.
          </div>

          <Button className="w-full" onClick={submit} disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "QR" ? (
              `Сгенерировать QR${value ? ` на ${fmtKzt(value)}` : ""}`
            ) : (
              `Выставить счёт${value ? ` на ${fmtKzt(value)}` : ""}`
            )}
          </Button>
        </>
      )}

      {active && active.status === "PENDING" && active.type === "QR" && active.qrToken && (
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-muted-foreground">К оплате</div>
          <div className="mb-3 text-2xl font-bold">{fmtKzt(active.amount)}</div>
          <div className="rounded-xl border p-3">
            <QRCodeSVG value={active.qrToken} size={200} level="M" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {active.kaspiStatus || "Ожидаем оплату"}
          </div>
          {secondsLeft != null && (
            <div className="mt-1 text-xs text-muted-foreground">
              {secondsLeft > 0
                ? `QR действует ещё ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
                : "Срок QR истёк, проверяем статус…"}
            </div>
          )}
          <a href={active.qrToken} className="mt-3 text-sm font-medium text-red-600 underline md:hidden">
            Открыть в Kaspi.kz
          </a>
          <Button variant="outline" className="mt-4 w-full" onClick={reset}>
            Закрыть
          </Button>
        </div>
      )}

      {active && active.status === "PENDING" && active.type === "INVOICE" && (
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Счёт выставлен</div>
          <div className="text-2xl font-bold">{fmtKzt(active.amount)}</div>
          {active.phone && <div className="mt-1 text-sm">на номер {fmtPhone(active.phone)}</div>}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Откройте Kaspi.kz → «Платежи» / уведомления и оплатите счёт.
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {active.kaspiStatus || "Ожидаем оплату"}
          </div>
          <Button variant="outline" className="mt-4 w-full" onClick={cancel}>
            Отменить счёт
          </Button>
        </div>
      )}

      {active && active.status !== "PENDING" && (
        <div className="flex flex-col items-center text-center">
          {active.status === "APPROVED" ? (
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
          <div className="mt-2 font-semibold">
            {active.status === "APPROVED" ? `Баланс пополнен на ${fmtKzt(active.amount)}` : "Платёж не завершён"}
          </div>
          {active.status !== "APPROVED" && active.kaspiStatus && (
            <div className="text-sm text-muted-foreground">{active.kaspiStatus}</div>
          )}
          <Button className="mt-4 w-full" onClick={reset}>
            Новое пополнение
          </Button>
        </div>
      )}
    </div>
  )
}
