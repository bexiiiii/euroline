"use client";
import React, { useCallback, useEffect, useState } from "react";
import Button from "../ui/button/Button";
import { kaspiApi, KaspiConnectionStatus } from "@/lib/api/kaspi";

type Step = "idle" | "phone" | "otp";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleString("ru-RU") : "—");

const STATUS_LABEL: Record<KaspiConnectionStatus["status"], { text: string; cls: string }> = {
  CONNECTED: { text: "Подключено", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" },
  EXPIRED: { text: "Сессия истекла — войдите снова", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  DISCONNECTED: { text: "Не подключено", cls: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400" },
};

/**
 * Подключение кассира Kaspi Pay: номер телефона → код из SMS. После входа клиенты могут пополнять баланс
 * QR-кодом или счётом в Kaspi, бэкенд сам проверяет оплату и зачисляет деньги.
 */
const KaspiConnectionCard: React.FC = () => {
  const [status, setStatus] = useState<KaspiConnectionStatus | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [processId, setProcessId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await kaspiApi.status());
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Не удалось загрузить статус Kaspi", error: true });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Ошибка", error: true });
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(async () => {
      const r = await kaspiApi.init();
      setProcessId(r.processId);
      setOtp("");
      setStep("phone");
    });

  const sendPhone = () =>
    run(async () => {
      if (!processId) return;
      const r = await kaspiApi.sendPhone(processId, phone);
      if (r.smsSent) {
        setStep("otp");
        setMessage({ text: r.message || "SMS с кодом отправлено" });
      } else {
        setMessage({ text: r.message || "Kaspi не отправил SMS", error: true });
      }
    });

  const verify = () =>
    run(async () => {
      if (!processId) return;
      setStatus(await kaspiApi.verifyOtp(processId, otp));
      setStep("idle");
      setProcessId(null);
      setMessage({ text: "Kaspi Pay подключён" });
    });

  const check = () => run(async () => setStatus(await kaspiApi.check()));

  const disconnect = () =>
    run(async () => {
      if (!window.confirm("Отключить Kaspi Pay? Клиенты не смогут пополнять баланс через Kaspi.")) return;
      setStatus(await kaspiApi.disconnect());
    });

  const badge = status ? STATUS_LABEL[status.status] : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Kaspi Pay — онлайн-пополнение</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Аккаунт кассира Kaspi Pay, через который клиентам выставляются счета и QR-коды на пополнение баланса.
          </p>
        </div>
        {badge && <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}>{badge.text}</span>}
      </div>

      {status && !status.enabled && (
        <p className="mt-3 text-sm text-amber-600">Оплата через Kaspi отключена в настройках сервера (KASPI_ENABLED).</p>
      )}

      {status && status.status !== "DISCONNECTED" && (
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-500">Организация</dt><dd className="text-gray-800 dark:text-white/90">{status.orgName || "—"}</dd></div>
          <div><dt className="text-gray-500">Телефон кассира</dt><dd className="text-gray-800 dark:text-white/90">{status.phone || "—"}</dd></div>
          <div><dt className="text-gray-500">Подключено</dt><dd className="text-gray-800 dark:text-white/90">{fmtDate(status.connectedAt)}</dd></div>
          <div><dt className="text-gray-500">Последняя проверка</dt><dd className="text-gray-800 dark:text-white/90">{fmtDate(status.lastCheckedAt)}</dd></div>
          {status.lastError && (
            <div className="sm:col-span-2"><dt className="text-gray-500">Ошибка</dt><dd className="text-red-600">{status.lastError}</dd></div>
          )}
        </dl>
      )}

      {step === "phone" && (
        <div className="mt-4 max-w-sm space-y-3">
          <label className="block text-sm text-gray-700 dark:text-gray-400">Телефон кассира Kaspi Pay</label>
          <input className={inputClass} placeholder="7XX XXX XX XX" inputMode="tel" value={phone}
                 onChange={(e) => setPhone(e.target.value)} />
          <p className="text-xs text-gray-500">
            Рекомендуется отдельный сотрудник-кассир: вход здесь может завершить сессию Kaspi Pay на телефоне этого номера.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={sendPhone} disabled={busy || phone.replace(/\D/g, "").length < 10}>Получить SMS</Button>
            <Button size="sm" variant="outline" onClick={() => setStep("idle")} disabled={busy}>Отмена</Button>
          </div>
        </div>
      )}

      {step === "otp" && (
        <div className="mt-4 max-w-sm space-y-3">
          <label className="block text-sm text-gray-700 dark:text-gray-400">Код из SMS</label>
          <input className={inputClass} placeholder="••••" inputMode="numeric" autoComplete="one-time-code" value={otp}
                 onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={verify} disabled={busy || otp.length < 4}>Подтвердить</Button>
            <Button size="sm" variant="outline" onClick={() => setStep("idle")} disabled={busy}>Отмена</Button>
          </div>
        </div>
      )}

      {step === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={start} disabled={busy}>
            {status?.status === "CONNECTED" ? "Войти заново" : "Подключить Kaspi Pay"}
          </Button>
          {status?.status === "CONNECTED" && (
            <Button size="sm" variant="outline" onClick={check} disabled={busy}>Проверить сессию</Button>
          )}
          {status && status.status !== "DISCONNECTED" && (
            <Button size="sm" variant="outline" onClick={disconnect} disabled={busy}>Отключить</Button>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.error ? "text-red-600" : "text-green-600"}`}>{message.text}</p>
      )}
    </div>
  );
};

export default KaspiConnectionCard;
