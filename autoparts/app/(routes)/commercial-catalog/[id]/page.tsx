"use client";

import Breadcrumbs from "@/components/Breadcrumb";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { vehicleApi, VehicleDto, WizardStepDto } from "@/lib/api/vehicle";

const items = [
  { label: "Главная", href: "/" },
  { label: "Каталоги", href: "/categories" },
  { label: "Выбор автомобиля", isCurrent: true },
];

// Атрибут авто с бэкенда: { code, label, values[] } (старый формат: { name, value })
type RawAttr = { code?: string; label?: string; name?: string; values?: string[]; value?: string };

function attrText(a: RawAttr) {
  const label = a.label || a.name || a.code || "";
  const value = (a.values && a.values.length > 0 ? a.values.join(", ") : a.value) || "";
  return { label, value };
}

/**
 * Подбор автомобиля по параметрам (Laximo GetWizard2 / FindVehicleByWizard2).
 * Каждый выбор = один вызов GetWizard2 с ssd из key выбранного значения.
 * Запросы к Laximo лимитированы: шаги кешируются здесь и на бэкенде,
 * список авто запрашивается только по кнопке.
 */
function VehicleSelection() {
  const params = useParams();
  const router = useRouter();
  const catalogCode = params.id as string;

  const [step, setStep] = useState<WizardStepDto | null>(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<VehicleDto[] | null>(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // ssd -> шаг, чтобы повторный выбор/сброс не шёл в сеть
  const stepCache = useRef(new Map<string, WizardStepDto>());

  const loadStep = useCallback(
    async (ssd: string | null) => {
      const cacheKey = ssd ?? "";
      setError(null);
      setVehicles(null);

      const cached = stepCache.current.get(cacheKey);
      if (cached) {
        setStep(cached);
        return;
      }

      setStepLoading(true);
      try {
        const next = await vehicleApi.wizardStep(catalogCode, ssd);
        stepCache.current.set(cacheKey, next);
        setStep(next);
      } catch (e) {
        console.error("Ошибка шага мастера:", e);
        setError("Не удалось загрузить параметры каталога. Попробуйте ещё раз.");
      } finally {
        setStepLoading(false);
      }
    },
    [catalogCode]
  );

  useEffect(() => {
    if (!catalogCode) return;
    stepCache.current.clear();
    setStep(null);
    loadStep(null);
  }, [catalogCode, loadStep]);

  const showVehicles = async () => {
    if (!step?.ssd) return;
    setVehiclesLoading(true);
    setError(null);
    try {
      const list = await vehicleApi.wizardVehicles(catalogCode, step.ssd);
      setVehicles(list);
    } catch (e) {
      console.error("Ошибка поиска автомобилей:", e);
      setError("Не удалось получить список автомобилей. Попробуйте ещё раз.");
    } finally {
      setVehiclesLoading(false);
    }
  };

  const openVehicle = (v: VehicleDto) => {
    const query = new URLSearchParams({
      ssd: v.ssd || "",
      catalog: v.catalog || catalogCode,
      brand: v.brand || "",
      name: v.name || "",
    });
    router.push(`/catalogs/${encodeURIComponent(v.vehicleId)}?${query.toString()}`);
  };

  const determined = step?.params.filter((p) => p.determined) ?? [];
  const open = step?.params.filter((p) => !p.determined && p.values.length > 0) ?? [];
  const canList = !!step?.ssd && (step.allowListVehicles || step.finalStep);
  const busy = stepLoading || vehiclesLoading;

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>

        <div className="pt-4">
          <h1 className="text-4xl font-bold">Выбор автомобиля {catalogCode.toUpperCase()}</h1>
        </div>

        <section className="bg-gray-100 p-6 rounded-lg mt-6">
          <div className="w-full max-w-5xl">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center justify-between gap-4">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => loadStep(step?.ssd ?? null)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Повторить
                </button>
              </div>
            )}

            {!step && stepLoading && (
              <div className="flex items-center gap-3 py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Загрузка параметров каталога...</span>
              </div>
            )}

            {step && (
              <>
                {/* Выбранные параметры */}
                {determined.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {determined.map((p) => (
                      <span
                        key={p.code}
                        className="inline-flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm"
                      >
                        <span className="text-gray-500">{p.label}:</span>
                        <span className="font-semibold">{p.value}</span>
                        {p.removeKey != null && (
                          <button
                            onClick={() => loadStep(p.removeKey || null)}
                            disabled={busy}
                            className="text-gray-400 hover:text-orange-600 disabled:opacity-50"
                            aria-label={`Сбросить ${p.label}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    <button
                      onClick={() => loadStep(null)}
                      disabled={busy}
                      className="text-sm text-orange-600 hover:underline disabled:opacity-50"
                    >
                      Сбросить всё
                    </button>
                  </div>
                )}

                {/* Параметры для выбора */}
                {open.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {open.map((p) => (
                      <div key={p.code}>
                        <label className="block text-sm font-medium mb-1 uppercase">{p.label}</label>
                        <select
                          value=""
                          disabled={busy}
                          onChange={(e) => e.target.value && loadStep(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                          <option value="">Выберите…</option>
                          {p.values.map((v) => (
                            <option key={v.code} value={v.code}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={showVehicles}
                    disabled={!canList || busy}
                    className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Показать автомобили
                  </button>
                  {stepLoading && (
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {!canList && !stepLoading && (
                    <span className="text-sm text-gray-500">Выберите параметры, чтобы найти автомобиль</span>
                  )}
                </div>
              </>
            )}

            {/* Найденные автомобили */}
            {vehiclesLoading && (
              <div className="flex items-center gap-3 py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Поиск автомобилей...</span>
              </div>
            )}

            {vehicles && !vehiclesLoading && (
              <div className="mt-8">
                {vehicles.length === 0 ? (
                  <p className="text-gray-600">Автомобили по выбранным параметрам не найдены.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v, i) => {
                      const attrs = ((v.attributes ?? []) as RawAttr[])
                        .map(attrText)
                        .filter((a) => a.label && a.value)
                        .slice(0, 4);
                      return (
                        <button
                          key={`${v.vehicleId}-${i}`}
                          onClick={() => openVehicle(v)}
                          className="text-left border rounded-lg bg-white p-5 hover:border-orange-500 transition"
                        >
                          <p className="text-lg font-bold">{v.name || v.brand}</p>
                          {v.brand && <p className="text-gray-500 text-sm mb-2">{v.brand}</p>}
                          {attrs.map((a) => (
                            <p key={a.label} className="text-sm text-gray-600">
                              <span className="text-gray-400">{a.label}:</span> {a.value}
                            </p>
                          ))}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default VehicleSelection;
