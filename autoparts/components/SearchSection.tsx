"use client";

import SearchIcon from "@/shared/icons /SearchIcon";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useVehicle } from "@/context/VehicleContext";

const SearchSection = () => {
  const [query, setQuery] = useState("");
  const { search, isLoading } = useSearchStore();
  const { setSession } = useVehicle();
  const router = useRouter();
  
  // Ref for search timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect - triggers search when user stops typing (both adding and deleting)
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If query is empty, do nothing on the main page
    if (query.trim().length === 0) {
      return;
    }
    
    // Don't trigger search for queries that are too short
    if (query.trim().length < 3) {
      return;
    }
    
    // Set new timeout to perform search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query.trim());
    }, 1000); // Wait 1 second after user stops typing (adding or deleting)
    
  }, [query]); // Trigger this effect whenever query changes

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      return;
    }

    // Выполняем поиск
    const result = await search(searchQuery);
    
    // Если найден автомобиль по VIN, сохраняем в контексте и открываем каталог
    if (result?.detectedType === 'VIN' && result?.vehicle) {
      const vehicleData = result.vehicle;
      
      // Сохраняем данные автомобиля в контексте
      setSession({
        vehicleId: vehicleData.vehicleId,
        ssd: vehicleData.ssd,
        catalog: vehicleData.catalog || 'SCANIA202010',
        brand: vehicleData.brand,
        name: vehicleData.name
      });
      
      // Открываем страницу каталога с параметрами
      const catalogUrl = `/catalogs/${vehicleData.vehicleId}?vin=${encodeURIComponent(searchQuery)}&ssd=${encodeURIComponent(vehicleData.ssd)}&catalog=${encodeURIComponent(vehicleData.catalog || '')}&brand=${encodeURIComponent(vehicleData.brand || '')}&name=${encodeURIComponent(vehicleData.name || '')}`;
      window.open(catalogUrl, '_blank');
      return;
    }
    
    // Для остальных типов поиска перенаправляем на страницу результатов
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any pending search timeout when user explicitly triggers search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (!query.trim()) {
      // If query is empty, do nothing
      return;
    }

    // Выполняем поиск immediately
    await performSearch(query.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Clear any pending search timeout when user explicitly triggers search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
      handleSearch(e as any);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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