"use client";

import Breadcrumbs from "@/components/Breadcrumb";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCommercialCatalogStore } from "@/lib/stores/commercialCatalogStore";
import { vehicleApi } from "@/lib/api/vehicle";

const items = [
  { label: "Главная", href: "/" },
  { label: "Каталоги", href: "/categories" },
  { label: "Выбор автомобиля", isCurrent: true },
];

type Car = {
  id: number;
  name: string;
  years: string;
  code?: string;
};

function VehicleSelection() {
  const params = useParams();
  const catalogCode = params.id as string;
  
  const {
    catalogInfo,
    catalogInfoLoading,
    wizardStep,
    wizardLoading,
    selectedWizardParams,
    setCatalogCode,
    fetchCatalogInfo,
    clearSearchResults
  } = useCommercialCatalogStore();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [modification, setModification] = useState("");
  const [availableCars, setAvailableCars] = useState<Car[]>([]);

  // Инициализация каталога
  useEffect(() => {
    if (catalogCode) {
      setCatalogCode(catalogCode);
      // Устанавливаем бренд на основе кода каталога
      setBrand(catalogCode.toUpperCase());
      // Временно отключаем загрузку информации о каталоге из-за ошибки на бэкенде
      // fetchCatalogInfo(catalogCode);
      clearSearchResults();
      // Инициализируем мастер поиска для получения доступных моделей
      initializeWizardData();
    }
  }, [catalogCode]);

  // Инициализация данных мастера для получения доступных автомобилей
  const initializeWizardData = async () => {
    try {
      const wizardData = await vehicleApi.wizardStart(catalogCode);
      
      // Сохраняем данные мастера в store
      useCommercialCatalogStore.setState({
        wizardStep: wizardData,
        wizardLoading: false,
        wizardError: null
      });

      console.log('Данные мастера получены:', wizardData);

      // Преобразуем данные мастера в формат для отображения карточек
      if (wizardData.params && wizardData.params.length > 0) {
        // Ищем параметр с моделями или первый доступный параметр
        const modelParam = wizardData.params.find(p => 
          p.label.toLowerCase().includes('модель') || 
          p.label.toLowerCase().includes('model') ||
          p.label.toLowerCase().includes('серия') ||
          p.label.toLowerCase().includes('тип')
        ) || wizardData.params[0];
        
        if (modelParam && modelParam.values.length > 0) {
          const cars: Car[] = modelParam.values.map((value, index) => ({
            id: index + 1,
            name: value.label,
            years: `Доступно в каталоге ${catalogCode.toUpperCase()}`,
            code: value.code
          }));
          
          setAvailableCars(cars);
          console.log('Загружены реальные данные автомобилей:', cars);
          return;
        }
      }
      
      // Если мастер вернул finalStep: true без параметров, создаем базовые варианты
      if (wizardData.finalStep && (!wizardData.params || wizardData.params.length === 0)) {
        console.log('Мастер завершен без параметров, создаем базовые варианты');
        setFallbackCarsForFinalStep();
        return;
      }
      
      // Если не удалось получить данные из мастера, показываем fallback
      console.log('Мастер не вернул подходящие данные, используем fallback');
      setFallbackCars();
      
    } catch (error) {
      console.error('Ошибка загрузки данных каталога:', error);
      setFallbackCars();
    }
  };

  // Функция для установки fallback данных
  const setFallbackCars = () => {
    const fallbackCars: Car[] = [
      { 
        id: 1, 
        name: `${catalogCode.toUpperCase()} Модель 1`, 
        years: "Доступна в каталоге" 
      },
      { 
        id: 2, 
        name: `${catalogCode.toUpperCase()} Модель 2`, 
        years: "Доступна в каталоге" 
      },
      { 
        id: 3, 
        name: `${catalogCode.toUpperCase()} Модель 3`, 
        years: "Доступна в каталоге" 
      },
    ];
    setAvailableCars(fallbackCars);
  };

  // Функция для создания вариантов когда мастер сразу завершен
  const setFallbackCarsForFinalStep = () => {
    const fallbackCars: Car[] = [
      { 
        id: 1, 
        name: `${catalogCode.toUpperCase()} Стандартная модель`, 
        years: "Все модификации",
        code: "default"
      },
      { 
        id: 2, 
        name: `${catalogCode.toUpperCase()} Премиум модель`, 
        years: "Расширенные опции",
        code: "premium"
      },
    ];
    setAvailableCars(fallbackCars);
  };

  // Обработчик выбора автомобиля
  const handleCarSelect = async (car: any) => {
    console.log('Выбран автомобиль:', car);
    
    // Если у автомобиля есть код из мастера, используем его
    if (car.code && wizardStep) {
      try {
        // Проходим через мастер с выбранным параметром
        const firstParam = wizardStep.params[0];
        if (firstParam) {
          const selections = { [firstParam.code]: car.code };
          
          if (wizardStep.finalStep) {
            // Завершаем поиск
            const vehicle = await vehicleApi.wizardFinish(catalogCode, wizardStep.ssd, selections);
            console.log('Найден автомобиль через мастер:', vehicle);
            // Здесь можно перейти к каталогу запчастей
            // TODO: Реализовать переход к каталогу запчастей
            alert(`Автомобиль найден: ${vehicle.name}\nВ будущем здесь будет переход к каталогу запчастей.`);
          } else {
            // Переходим к следующему шагу мастера
            const nextStep = await vehicleApi.wizardNext(catalogCode, wizardStep.ssd, selections);
            console.log('Следующий шаг мастера:', nextStep);
            // Обновляем состояние мастера
            useCommercialCatalogStore.setState({
              wizardStep: nextStep,
              selectedWizardParams: selections,
              wizardLoading: false,
              wizardError: null
            });
          }
        }
      } catch (error) {
        console.error('Ошибка при выборе автомобиля:', error);
        alert('Ошибка при выборе автомобиля. Попробуйте еще раз.');
      }
    } else {
      // Fallback для случаев без мастера
      alert(`Выбран автомобиль: ${car.name}\nВ будущем здесь будет переход к каталогу запчастей.`);
    }
  };

  // Используем данные из состояния, если они есть, иначе показываем загрузку
  const displayCars = availableCars.length > 0 ? availableCars : [];

  return (
    <div className="bg-white min-h-screen pt-24">
          <main className="container mx-auto px-6">
            <div className="pt-5">
              <Breadcrumbs items={items} />
            </div>
    
            <div className="pt-4">
              {catalogInfoLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Загрузка каталога...</span>
                </div>
              ) : catalogInfo ? (
                <h1 className="text-4xl font-bold">
                  Выбор автомобиля {catalogInfo.brand || catalogInfo.name}
                </h1>
              ) : (
                <h1 className="text-4xl font-bold">Выбор транспортного средства</h1>
              )}
            </div>
            
            <section className="bg-gray-100 p-6 rounded-lg mt-6">
      <div className="w-full max-w-5xl">
       

        {/* Форма */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 ">
          <div>
            <label className="block text-sm font-medium mb-1">МАРКА</label>
            <input
              type="text"
              value={catalogInfo?.brand || brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={catalogInfoLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">МОДЕЛЬ</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Введите модель"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              МОДИФИКАЦИЯ
            </label>
            <input
              type="text"
              value={modification}
              onChange={(e) => setModification(e.target.value)}
              placeholder="Введите модификацию"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Список карточек */}
        {wizardLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка доступных моделей...</span>
            </div>
          </div>
        ) : displayCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {displayCars.map((car) => (
              <div
                key={car.id}
                onClick={() => handleCarSelect(car)}
                className="border rounded-lg bg-white p-6 flex flex-col items-center text-center hover:border-orange-500 transition cursor-pointer"
              >
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded mb-4 overflow-hidden">
                  <img
                    src="/images/track_placeholder.png"
                    alt="Изображение недоступно"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-lg font-bold">{car.name}</p>
                <p className="text-gray-500">{car.years}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Загрузка данных каталога
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Подождите, идет загрузка доступных моделей из каталога {catalogCode.toUpperCase()}
            </p>
            <button
              onClick={() => initializeWizardData()}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>
  </section>

  
        
      </main>
    </div>
  );
}


export default VehicleSelection;
        
