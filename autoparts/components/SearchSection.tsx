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
  
  // Ref for debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Professional debounced search - triggers only after user stops typing
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const trimmed = query.trim();
    
    // Don't search if empty
    if (trimmed.length === 0) {
      return;
    }
    
    // Don't search if too short (minimum 2 characters)
    if (trimmed.length < 2) {
      return;
    }
    
    // Set timeout for debounced search (800ms for main page)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(trimmed);
    }, 800);
    
    // Cleanup on unmount or when query changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]); // Only depend on query

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
    
    // Cancel debounced search and perform immediate search
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
      // Cancel debounced search and perform immediate search on Enter
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
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