"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CatalogSectionsComponent from "../CatalogSectionsComponent";
import { Sidebar } from "./modern-side-bar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCatalogsStore } from "@/lib/stores/catalogsStore";
import { CatalogDto } from "@/lib/api/catalogs";

function TabDemo() {
  const {
    truckCatalogs,
    truckCatalogsLoading,
    truckCatalogsError,
    fetchTruckCatalogs,
    clearErrors
  } = useCatalogsStore();

  // Загружаем каталоги грузовых автомобилей при монтировании
  useEffect(() => {
    fetchTruckCatalogs();
  }, [fetchTruckCatalogs]);

  // Очищаем ошибки при размонтировании
  useEffect(() => {
    return () => {
      clearErrors();
    };
  }, [clearErrors]);

  const renderTruckBrands = () => {
    if (truckCatalogsLoading) {
      return (
        <div className="col-span-full flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Загрузка каталогов грузовых автомобилей...</span>
          </div>
        </div>
      );
    }

    if (truckCatalogsError) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Ошибка загрузки каталогов
          </div>
          <p className="text-gray-600 text-center mb-4">{truckCatalogsError}</p>
          <button 
            onClick={fetchTruckCatalogs}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    if (truckCatalogs.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Каталоги грузовых автомобилей не найдены
          </div>
          <p className="text-gray-500 text-center">
            На данный момент каталоги грузовых автомобилей недоступны
          </p>
        </div>
      );
    }

    return truckCatalogs.map((catalog) => (
      <Link 
        key={catalog.code} 
        href={`/commercial-catalog/${catalog.code}`} 
        passHref
      >
        <span 
          className="hover:text-orange-500 transition-colors cursor-pointer block p-3 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200"
          title={`${catalog.name} - ${catalog.brand}`}
        >
          <div className="font-medium">{catalog.brand || catalog.name}</div>
          {catalog.name !== catalog.brand && (
            <div className="text-xs text-gray-500 mt-1">{catalog.name}</div>
          )}
          {catalog.region && (
            <div className="text-xs text-gray-400 mt-1">{catalog.region}</div>
          )}
        </span>
      </Link>
    ));
  };

  return (
    <Tabs defaultValue="tab-1">
      <TabsList className="h-auto gap-2 rounded-none border-b border-border bg-transparent px-0 py-1 text-foreground">
        <TabsTrigger
          value="tab-1"
          className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
        >
          По каталогу
        </TabsTrigger>
        <TabsTrigger
          value="tab-2"
          className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
        >
          По маркам грузовых автомобилей
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tab-1">
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1">
            <CatalogSectionsComponent />
            <div className="mt-8">
              {/* Дополнительный контент */}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="tab-2">
        <div className="min-h-[400px]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Каталоги запчастей для грузовых автомобилей
            </h2>
            
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm text-gray-800">
            {renderTruckBrands()}
          </div>
          
          
        </div>
      </TabsContent>
    </Tabs>
  );
}

function SimpleTabsWithUnderlineAndBoldFont() {
  return (
    <div className="block">
      <TabDemo />
    </div>
  );
}

export { SimpleTabsWithUnderlineAndBoldFont };
