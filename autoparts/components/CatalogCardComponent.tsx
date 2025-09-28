
import Link from 'next/link';
import React from 'react';
import { DetailDto } from '@/lib/api/vehicle';
import { Loader2, MousePointer, FolderTree, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVehicle } from '@/context/VehicleContext';

interface SelectedQuickGroup {
  groupId: number;
  groupName: string;
  details: DetailDto[];
  isLoading: boolean;
}

interface CatalogCardComponentProps {
  selectedQuickGroup?: SelectedQuickGroup | null;
}

export interface OilFilterPart {
  name: string;
  code: string;
  imageUrl?: string;
  qty?: number;
  note?: string;
  detail: DetailDto; // Добавляем ссылку на полную деталь
}

export interface OilFilterUnit {
  id: string;
  title: string;
  imageUrl?: string;
  parts: OilFilterPart[];
  unitDetail: DetailDto; // Добавляем ссылку на оригинальную деталь для навигации
}

const CatalogCardComponent: React.FC<CatalogCardComponentProps> = ({ selectedQuickGroup }) => {
  const router = useRouter();
  const { session } = useVehicle();

  // Обработчик клика для навигации к странице unit
  const handleUnitClick = (detail: DetailDto) => {
    if (!session) {
      console.warn('Нет сессии для навигации к unit');
      return;
    }

    // Используем unitId для навигации, который теперь должен быть числовым
    const unitId = detail.unitId;
    console.log('CatalogCard: handleUnitClick вызван с detail:', { 
      name: detail.name, 
      oem: detail.oem, 
      unitId: detail.unitId 
    });
    
    if (!unitId) {
      console.warn('Отсутствует unitId для навигации');
      return;
    }

    // Формируем URL для страницы unit с параметрами сессии
    const params = new URLSearchParams({
      vin: session.brand || '',
      brand: session.brand || '',
      name: session.name || '',
      vehicleId: session.vehicleId, // Передаём оригинальный vehicleId
      ssd: session.ssd,
      catalog: session.catalog
    });

    const unitUrl = `/unit/${unitId}?${params.toString()}`;
    console.log('Навигация к unit:', unitUrl);
    router.push(unitUrl);
  };
  // Если ничего не выбрано, показываем заглушку
  if (!selectedQuickGroup) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="relative mb-6">
            {/* Основная иконка дерева */}
            <FolderTree className="h-24 w-24 text-gray-300 mb-2" />
            {/* Маленькая иконка курсора для показа интерактивности */}
            <MousePointer className="absolute -top-2 -right-2 h-8 w-8 text-blue-500 animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Выберите категорию</h1>
          <p className="text-gray-500 max-w-md">
            Кликните на любой фильтр в дереве категорий слева, чтобы увидеть детали и запчасти
          </p>
          
          {/* Декоративные иконки запчастей */}
          <div className="flex gap-4 mt-6 opacity-40">
            <Package className="h-6 w-6 text-gray-400" />
            <Package className="h-6 w-6 text-gray-400" />
            <Package className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  // Если загружается
  if (selectedQuickGroup.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Загружаем {selectedQuickGroup.groupName}...</h3>
          <p className="mt-2 text-sm text-gray-500">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  // Группируем детали по узлам (unitName)
  const groupedByUnits = selectedQuickGroup.details.reduce((acc, detail) => {
    const unitName = detail.unitName || 'Без названия узла';
    const unitCode = detail.unitCode || '';
    const unitKey = `${unitName}-${unitCode}`;
    
    if (!acc[unitKey]) {
      // Отладка изображений
      console.log(`🖼️ Создаем узел "${unitName}":`, {
        imageUrl: detail.imageUrl,
        largeImageUrl: detail.largeImageUrl,
        hasImage: !!(detail.imageUrl || detail.largeImageUrl)
      });
      
      // Исправляем URL изображения - заменяем %size% на конкретный размер
      let imageUrl = detail.imageUrl || detail.largeImageUrl;
      if (imageUrl && imageUrl.includes('%size%')) {
        imageUrl = imageUrl.replace('%size%', 'source'); // Используем оригинальный размер
        console.log(`🔧 Исправили URL изображения:`, imageUrl);
      }
      
      acc[unitKey] = {
        id: detail.unitId?.toString() || unitCode, // Используем числовой unitId для навигации
        title: unitName,
        imageUrl: imageUrl,
        parts: [],
        unitDetail: detail // Сохраняем оригинальную деталь
      };
    }
    
    // Исправляем URL изображения детали
    let partImageUrl = detail.imageUrl;
    if (partImageUrl && partImageUrl.includes('%size%')) {
      partImageUrl = partImageUrl.replace('%size%', '150'); // Меньший размер для деталей
    }
    
    acc[unitKey].parts.push({
      name: detail.name,
      code: detail.oem,
      imageUrl: partImageUrl,
      qty: detail.qty,
      note: detail.note,
      detail: detail // Сохраняем полную деталь
    });
    
    return acc;
  }, {} as { [key: string]: OilFilterUnit });

  const unitsArray = Object.values(groupedByUnits);

  // Если нет деталей
  if (unitsArray.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{selectedQuickGroup.groupName}</h1>
        <p className="text-gray-500">Для категории "{selectedQuickGroup.groupName}" детали не найдены</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{selectedQuickGroup.groupName}</h1>
      <Link href="#" className="text-blue-600 underline mb-6 inline-block">
        {selectedQuickGroup.details[0]?.categoryName || 'Категория'}
      </Link>

      <div className="space-y-6">
        {unitsArray.map((unit: OilFilterUnit, idx: number) => (
          <div key={unit.id || idx} className="flex border p-4 rounded-lg bg-white ">
            {/* Image placeholder */}
            <div className="w-1/3">
              <div 
                className="w-full h-40 bg-gray-200 flex items-center justify-center text-sm text-gray-500 cursor-pointer hover:bg-gray-300 transition-colors"
                onClick={() => {
                  if (unit.imageUrl) {
                    // Исправляем URL для большого изображения в модале
                    let modalImageUrl = unit.imageUrl;
                    if (modalImageUrl.includes('250')) {
                      modalImageUrl = modalImageUrl.replace('250', '250'); // Пока оставляем тот же размер
                    }
                    
                    // Открываем модальное окно с изображением
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    modal.innerHTML = `
                      <div class="max-w-4xl max-h-full p-4 relative">
                        <img src="${modalImageUrl}" 
                             alt="${unit.title}" 
                             class="max-w-full max-h-full object-contain rounded" />
                        <button class="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center" onclick="this.parentElement.parentElement.remove()">×</button>
                      </div>
                    `;
                    document.body.appendChild(modal);
                    modal.addEventListener('click', (e) => {
                      if (e.target === modal) modal.remove();
                    });
                  }
                }}
              >
                {unit.imageUrl ? (
                  <img 
                    src={unit.imageUrl} 
                    alt={unit.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      console.error(`❌ Ошибка загрузки изображения для "${unit.title}":`, unit.imageUrl);
                      // Скрываем сломанное изображение
                      e.currentTarget.style.display = 'none';
                      // Показываем текст-заглушку
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-sm text-gray-500">
                          <div class="text-center">
                            <div class="mb-2">📦</div>
                            <div>Изображение недоступно</div>
                            <div class="text-xs mt-1">${unit.title}</div>
                          </div>
                        </div>`;
                      }
                    }}
                    onLoad={() => {
                      console.log(`✅ Изображение загружено для "${unit.title}":`, unit.imageUrl);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔧</div>
                      <div>Изображение узла {idx + 1}</div>
                      <div className="text-xs mt-1">{unit.title}</div>
                    </div>
                  </div>
                )}
              </div>
              <Link href="#" onClick={(e) => {
                e.preventDefault();
                handleUnitClick(unit.unitDetail);
              }}>
                <p className="mt-2 text-sm font-semibold text-blue-600 hover:text-orange-500 ">
                  Узел {unit.title} ({unit.unitDetail.unitId})
                </p>
              </Link>
            </div>

            {/* Parts */}
            <div className="w-2/3 pl-6 space-y-2">
              {unit.parts.map((part: OilFilterPart, index: number) => (
                <div
                  key={index}
                  className="border-l-4 pl-2 py-1 hover:border-orange-500 hover:bg-orange-100 transition-colors cursor-pointer"
                  title={`${part.qty ? `Количество: ${part.qty}` : ''}${part.note ? ` | Примечание: ${part.note}` : ''}`}
                >
                  <p className="text-sm">
                    {part.name}
                    {part.qty && <span className="text-green-600 ml-2 font-medium">📦 {part.qty} шт.</span>}
                    {part.note && <span className="text-blue-600 ml-2" title={part.note}>ℹ️</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <a href="#" className="text-blue-600 text-sm hover:text-blue-800">
                      {part.code}
                    </a>
                    {/* Показываем дополнительную информацию из allAttributes */}
                    {part.detail.additionalNote && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {part.detail.additionalNote}
                      </span>
                    )}
                    {part.detail.replacedOem && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded" title="Заменяет OEM">
                        ↺ {part.detail.replacedOem}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <Link href="#" onClick={(e) => {
                e.preventDefault();
                handleUnitClick(unit.unitDetail);
              }} className="text-sm font-semibold text-blue-600  inline-block mt-2 hover:text-orange-500">
                СМОТРЕТЬ ВСЕ ДЕТАЛИ УЗЛА
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogCardComponent;
