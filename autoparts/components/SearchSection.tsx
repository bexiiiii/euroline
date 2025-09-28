"use client";

import SearchIcon from "@/shared/icons /SearchIcon";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useVehicle } from "@/context/VehicleContext";

const SearchSection = () => {
  const [query, setQuery] = useState("");
  const { search, isLoading } = useSearchStore();
  const { setSession } = useVehicle();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      return;
    }

    // Выполняем поиск
    const result = await search(query.trim());
    
    // Если найден автомобиль по VIN, сохраняем в контексте и открываем каталог
    if (result?.detectedType === 'VIN' && result?.vehicle) {
      const vehicleData = result.vehicle;
      
      // Сохраняем данные автомобиля в контексте
      setSession({
        vehicleId: vehicleData.vehicleId,
        ssd: vehicleData.ssd,
        catalog: vehicleData.catalog || 'SCANIA202010',
        brand: vehicleData.brand,
        name: vehicleData.name,
        attributes: vehicleData.attributes || []
      });
      
      // Открываем страницу каталога с параметрами
      const catalogUrl = `/catalogs/${vehicleData.vehicleId}?vin=${encodeURIComponent(query.trim())}&ssd=${encodeURIComponent(vehicleData.ssd)}&catalog=${encodeURIComponent(vehicleData.catalog || '')}&brand=${encodeURIComponent(vehicleData.brand || '')}&name=${encodeURIComponent(vehicleData.name || '')}`;
      window.open(catalogUrl, '_blank');
      return;
    }
    
    // Для остальных типов поиска перенаправляем на страницу результатов
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  return (
    <section className="pt-32 pb-8 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите VIN, код или название запчасти"
              className="w-full h-16 pl-6 pr-20 text-lg rounded-full border border-gray-900/20 bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Поиск"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SearchIcon className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
export default SearchSection;