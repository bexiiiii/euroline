"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumb";
import { DetailDto, UnitInfoDto } from "@/lib/api/vehicle";
import { useVehicle } from "@/context/VehicleContext";
import { vehicleApi } from "@/lib/api/vehicle";
import { Info, Loader2 } from "lucide-react";
import InteractivePartsDiagram from "@/components/InteractivePartsDiagram";

interface VehicleInfo {
  vin?: string;
  brand?: string;
  name?: string;
  unitId?: string;
}

function UnitPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({});
  const [unitDetails, setUnitDetails] = useState<DetailDto[]>([]);
  const [unitInfo, setUnitInfo] = useState<UnitInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Наведение/клик по номеру на схеме: подсветить и прокрутить список к детали
  const highlightFromDiagram = (code: string | null, smooth = false) => {
    setHoveredCode(code);
    if (!code || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(`[data-code="${CSS.escape(code)}"]`);
    item?.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
  };
  const { session, setSession } = useVehicle();

  useEffect(() => {
    const vin = searchParams?.get('vin') || '';
    const brand = searchParams?.get('brand') || '';
    const name = searchParams?.get('name') || '';
    const unitId = params?.id as string || '';
    const vehicleId = searchParams?.get('vehicleId') || '';  // Получаем оригинальный vehicleId из URL
    const ssd = searchParams?.get('ssd') || '';
    const catalog = searchParams?.get('catalog') || 'SCANIA202010';

    setVehicleInfo({
      vin,
      brand,
      name,
      unitId
    });

    // Устанавливаем сессию в контексте если есть все необходимые данные
    if (vehicleId && catalog && ssd) {  // Используем vehicleId для проверки
      console.log('UnitPage: Устанавливаем сессию:', {
        vehicleId: vehicleId, // Используем оригинальный vehicleId из URL
        ssd: ssd.substring(0, 50) + '...',
        catalog,
        brand,
        name
      });

      setSession({
        vehicleId: vehicleId, // Используем оригинальный vehicleId вместо unitId
        ssd,
        catalog,
        brand,
        name
      });
    }
  }, [params, searchParams, setSession]);

  // Загружаем детали узла и информацию об узле.
  // Для функций узла Laximo нужен ssd самого узла (Unit@ssd), а не ssd автомобиля —
  // иначе E_INVALIDPARAMETER:ssd. Зависим от примитивов, чтобы не слать запросы повторно.
  const unitCatalog = searchParams?.get('catalog') || session?.catalog || '';
  const unitSsd = searchParams?.get('unitSsd') || searchParams?.get('ssd') || session?.ssd || '';
  const unitIdParam = params?.id as string | undefined;

  useEffect(() => {
    if (!unitCatalog || !unitSsd || !unitIdParam) {
      return;
    }

    const unitId = parseInt(unitIdParam);
    if (isNaN(unitId)) {
      setError('Неверный ID узла');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      vehicleApi.getUnitDetails(unitCatalog, unitId, unitSsd),
      vehicleApi.getUnitInfo(unitCatalog, unitId, unitSsd)
    ])
      .then(([details, unitInfoData]) => {
        if (cancelled) return;
        setUnitDetails(details);
        setUnitInfo(unitInfoData);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Ошибка загрузки узла:', err);
        setError('Ошибка загрузки данных узла');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [unitCatalog, unitSsd, unitIdParam]);

  const items = [
    { label: "Главная", href: "/" },
    { label: "Каталоги", href: "/catalogs" },
    { 
      label: vehicleInfo.brand && vehicleInfo.name 
        ? `${vehicleInfo.brand} / ${vehicleInfo.name}` 
        : "Узел", 
      isCurrent: true 
    },
  ];

  if (loading) {
    return (
      <div className="bg-white min-h-screen pt-24">
        <main className="container mx-auto px-6">
          <div className="pt-5">
            <Breadcrumbs items={items} />
          </div>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Загружаем детали узла...</h3>
              <p className="mt-2 text-sm text-gray-500">Пожалуйста, подождите</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen pt-24">
        <main className="container mx-auto px-6">
          <div className="pt-5">
            <Breadcrumbs items={items} />
          </div>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-red-600 mb-2">Ошибка</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Получаем информацию об узле из state и первой детали для резервных данных
  const firstDetail = unitDetails[0];
  const unitName = unitInfo?.name || firstDetail?.unitName || `Узел ${vehicleInfo.unitId}`;
  const unitCode = unitInfo?.code || firstDetail?.unitCode || vehicleInfo.unitId;

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>

        <h1 className="text-4xl font-bold pt-4">
          {unitName}
        </h1>
        
        {vehicleInfo.brand && vehicleInfo.name && (
          <p className="text-xl text-gray-600 mt-2">
            {vehicleInfo.brand} {vehicleInfo.name}
          </p>
        )}

        <section className="bg-gray-100 p-6 mt-6">
          {/* Заголовок */}
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Узел {unitCode} • {unitName}
            </h1>
            {unitInfo?.note && (
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {unitInfo.note}
              </p>
            )}
          </div>

          {/* Контент */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 items-start">
            {/* Схема слева — закреплена при прокрутке */}
            <section className="relative bg-white rounded-2xl shadow p-3 lg:sticky lg:top-28">
              {unitInfo?.imageUrl ? (
                <InteractivePartsDiagram
                  unitDetails={unitDetails}
                  imageUrl={unitInfo.imageUrl}
                  unitName={unitName}
                  catalog={unitCatalog}
                  unitId={parseInt(params?.id as string) || 0}
                  ssd={unitSsd}
                  onHoverChange={(code) => highlightFromDiagram(code)}
                  onSelect={(code) => highlightFromDiagram(code, true)}
                  hoveredCode={hoveredCode}
                />
              ) : (
                <div className="relative aspect-[4/3] md:aspect-[5/4] bg-[radial-gradient(circle_at_30%_20%,#f4f4f5,transparent_55%),radial-gradient(circle_at_70%_80%,#f4f4f5,transparent_45%)] flex items-center justify-center">
                  <p className="text-gray-500">Изображение недоступно</p>
                </div>
              )}
            </section>

            {/* Список деталей справа */}
            <aside className="bg-white rounded-2xl shadow p-3 md:p-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:sticky lg:top-28">
              {/* Шапка комплекта */}
              <div className="mb-3 rounded border-l-4 border-amber-500 bg-amber-50 p-3">
                <div className="text-sm text-gray-700 font-medium">{unitName}</div>
                <div className="text-sm text-blue-600">
                  Код узла: {unitCode}
                </div>
              </div>

              {/* Список деталей */}
              <ul ref={listRef} className="divide-y">
                {unitDetails.map((detail, index) => {
                  const isHovered = hoveredCode === detail.codeOnImage;
                  
                  return (
                    <li 
                      key={`${detail.oem}-${index}`}
                      data-code={detail.codeOnImage || undefined}
                      className={`py-2 transition-all duration-200 ${
                        isHovered ? 'bg-orange-50 border-l-4 border-orange-400 pl-2' : ''
                      }`}
                    >
                      <div 
                        className={`group flex items-start gap-3 px-2 py-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isHovered ? 'bg-orange-50' : ''
                        }`}
                        onMouseEnter={() => detail.codeOnImage && setHoveredCode(detail.codeOnImage)}
                        onMouseLeave={() => setHoveredCode(null)}
                      >
                        <div className={`w-6 shrink-0 text-sm pt-0.5 font-medium transition-colors ${
                          isHovered 
                            ? 'text-orange-600 bg-orange-100 rounded px-1' 
                            : detail.codeOnImage 
                              ? 'text-blue-600 hover:text-blue-800' 
                              : 'text-gray-500'
                        }`}>
                          {detail.codeOnImage || (index + 1)}
                        </div>
                        <div className="flex-1">
                          <div className={`text-[15px] leading-snug transition-colors ${
                            isHovered ? 'text-orange-900 font-medium' : 'text-gray-900'
                          }`}>
                            • <span className="font-medium">{detail.name}</span>
                            {detail.qty && (
                              <span className={`ml-2 font-medium transition-colors ${
                                isHovered ? 'text-orange-600' : 'text-green-600'
                              }`}>({detail.qty} шт.)</span>
                            )}
                            {detail.additionalNote && (
                              <span className={`text-xs px-1 py-0.5 rounded ml-2 transition-colors ${
                                isHovered 
                                  ? 'text-orange-600 bg-orange-100' 
                                  : 'text-gray-500 bg-gray-100'
                              }`}>
                                {detail.additionalNote}
                              </span>
                            )}
                          </div>
                          <div className={`text-sm group-hover:underline transition-colors ${
                            isHovered ? 'text-orange-600 font-medium' : 'text-blue-600'
                          }`}>
                            {detail.oem}
                            {detail.replacedOem && (
                              <span className={`text-xs ml-2 transition-colors ${
                                isHovered ? 'text-orange-500' : 'text-orange-600'
                              }`} title="Заменяет OEM">
                                (заменяет: {detail.replacedOem})
                              </span>
                            )}
                          </div>
                          {detail.note && (
                            <div className={`text-xs mt-1 transition-colors ${
                              isHovered ? 'text-orange-600' : 'text-gray-500'
                            }`}>
                              {detail.note}
                            </div>
                          )}
                          {detail.footnote && (
                            <div className={`text-xs mt-1 italic transition-colors ${
                              isHovered ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                              {detail.footnote}
                            </div>
                          )}
                          {/* Показываем дополнительные атрибуты из allAttributes */}
                          {detail.allAttributes && Object.keys(detail.allAttributes).length > 0 && (
                            <div className={`text-xs mt-1 transition-colors ${
                              isHovered ? 'text-orange-400' : 'text-gray-400'
                            }`}>
                              {Object.entries(detail.allAttributes)
                                .filter(([key]) => !['amount', 'note', 'footnote', 'addnote', 'replacedoem', 'substType'].includes(key))
                                .map(([key, value]) => (
                                  <span key={key} className="mr-2">
                                    {key}: {value}
                                  </span>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <Info
                          className={`h-4 w-4 shrink-0 cursor-help transition-colors ${
                            isHovered ? 'text-orange-400' : 'text-gray-300'
                          }`}
                          aria-label="Информация о детали"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UnitPage;
        