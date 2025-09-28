"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumb";
import CatalogCardComponent from "@/components/CatalogCardComponent";
import FileTree from "@/components/FileTree";
import { DetailDto } from "@/lib/api/vehicle";
import { useVehicle } from "@/context/VehicleContext";

interface VehicleInfo {
  vin?: string;
  brand?: string;
  name?: string;
  vehicleId?: string;
}

interface SelectedQuickGroup {
  groupId: number;
  groupName: string;
  details: DetailDto[];
  isLoading: boolean;
}

function Catalogs() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({});
  const [selectedQuickGroup, setSelectedQuickGroup] = useState<SelectedQuickGroup | null>(null);
  const { session, setSession } = useVehicle();

  useEffect(() => {
    const vin = searchParams?.get('vin') || '';
    const brand = searchParams?.get('brand') || '';
    const name = searchParams?.get('name') || '';
    const vehicleId = params?.id as string || '';
    const ssd = searchParams?.get('ssd') || '';
    const catalog = searchParams?.get('catalog') || 'SCANIA202010'; // Default catalog

    setVehicleInfo({
      vin,
      brand,
      name,
      vehicleId
    });

    // Устанавливаем сессию в контексте если есть все необходимые данные
    if (vehicleId && catalog) {
      if (ssd) {
        // Полная сессия с SSD
        console.log('Устанавливаем полную сессию автомобиля:', {
          vehicleId,
          ssd: ssd.substring(0, 50) + '...',
          catalog,
          brand,
          name
        });

        setSession({
          vehicleId,
          ssd,
          catalog,
          brand,
          name
        });
      } else {
        // Временная сессия без SSD (для тестирования)
        console.warn('Устанавливаем временную сессию без SSD:', {
          vehicleId,
          catalog,
          brand,
          name
        });

        setSession({
          vehicleId,
          ssd: 'temp-ssd-for-testing', // Временный SSD
          catalog,
          brand,
          name
        });
      }
    } else {
      console.warn('Недостаточно данных для установки сессии:', {
        hasVehicleId: !!vehicleId,
        hasSsd: !!ssd,
        hasCatalog: !!catalog
      });
    }
  }, [params, searchParams, setSession]);

  // Обработчик выбора группы в FileTree
  const handleQuickGroupSelected = (groupId: number, groupName: string, details: DetailDto[]) => {
    setSelectedQuickGroup({
      groupId,
      groupName,
      details,
      isLoading: false
    });
  };

  // Обработчик начала загрузки группы
  const handleQuickGroupLoading = (groupId: number, groupName: string) => {
    setSelectedQuickGroup({
      groupId,
      groupName,
      details: [],
      isLoading: true
    });
  };

  useEffect(() => {
    const vin = searchParams?.get('vin') || '';
    const brand = searchParams?.get('brand') || '';
    const name = searchParams?.get('name') || '';
    const vehicleId = params?.id as string || '';

    setVehicleInfo({
      vin,
      brand,
      name,
      vehicleId
    });
  }, [params, searchParams]);

  const items = [
    { label: "Главная", href: "/" },
    { label: "Каталоги", href: "/catalogs" },
    { 
      label: vehicleInfo.brand && vehicleInfo.name 
        ? `${vehicleInfo.brand} / ${vehicleInfo.name}` 
        : "Каталог", 
      isCurrent: true 
    },
  ];

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>

        <h1 className="text-4xl font-bold pt-4">
          {vehicleInfo.brand && vehicleInfo.name 
            ? `Каталог товаров оригинальных запчастей для ${vehicleInfo.brand} ${vehicleInfo.name}`
            : 'Каталог товаров оригинальных запчастей'
          }
        </h1>

        {vehicleInfo.brand && vehicleInfo.name && (
          <section className="pb-6">
            <h2 className="text-xl font-semibold px-2 pt-4">{vehicleInfo.brand} {vehicleInfo.name}</h2>
            {vehicleInfo.vin && (
              <p className="px-2 font-semibold text-xl">VIN: {vehicleInfo.vin}</p>
            )}
           
          </section>
        )}

        {/* Два столбца — левый дерево, правый карточки */}
        <section className="bg-gray-100 mt-30 py-10">
          <div className="container mx-auto px-6">
            <div className="flex gap-6">
              
              {/* Левая часть — дерево */}
              <aside className="w-1/3 overflow-y-auto border rounded-md bg-white p-4">
                <FileTree 
                  onQuickGroupSelected={handleQuickGroupSelected}
                  onQuickGroupLoading={handleQuickGroupLoading}
                />
              </aside>

              {/* Правая часть — карточки */}
              <div className="w-2/3">
                <CatalogCardComponent selectedQuickGroup={selectedQuickGroup} />
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Catalogs;
