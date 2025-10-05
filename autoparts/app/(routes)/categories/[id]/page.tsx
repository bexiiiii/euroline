"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Breadcrumbs from "@/components/Breadcrumb"
import CategoryFiltersSidebar from "@/components/CategoryFiltersSidebar"
import ItemCardComponent, { Product as UIProduct } from "@/components/ItemCardComponent"
import PaginationButton from "@/components/PaginationWithPrimaryButton"
import { PackageSearch, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { getProductsByCategory, ProductResponse, CategoryProductsFilters } from "@/lib/api/products"
import { PaginatedResponse } from "@/lib/api/types"
import { API_BASE } from "@/lib/api/base"

interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
  productCount: number;
  createdAt: number;
  updatedAt: number;
}

// Simple mapping for category names - this can be enhanced later
const CATEGORY_NAMES: Record<number, string> = {
  6: 'Аккумуляторы',
  7: 'Лампы',
  8: 'Портативные ПЗУ',
  9: 'Свечи сжигания',
  10: 'Щетки для снега',
  11: 'Шины',
  12: 'Автохимия',
  13: 'Антифризы',
  14: 'Ториозные жидкости',
  15: 'Присадки в масло',
  16: 'Антикоры',
  17: 'Масла и технические жидкости',
  18: 'Моторные масла',
  19: 'Жидкости гур',
  20: 'Жидкости и средства',
  21: 'Трансмиссионные масла',
  22: 'Щетки стеклоочистителя',
};

export default function CategoryPage() {
  const params = useParams()
  const categoryId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageData, setPageData] = useState<PaginatedResponse<ProductResponse> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [size, setSize] = useState(12)
  const [availableBrands, setAvailableBrands] = useState<string[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [inStock, setInStock] = useState<boolean | undefined>(undefined)
  const [priceFrom, setPriceFrom] = useState<number | undefined>(undefined)
  const [priceTo, setPriceTo] = useState<number | undefined>(undefined)

  const filters: CategoryProductsFilters = useMemo(() => ({
    q: searchQuery || undefined,
    brands: selectedBrands.length > 0 ? selectedBrands : undefined,
    inStock,
    priceFrom,
    priceTo,
    sort: 'id,desc'
  }), [searchQuery, selectedBrands, inStock, priceFrom, priceTo])

  const categoryName = CATEGORY_NAMES[categoryId] || `Категория ${categoryId}`;
  
  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Категории", href: "/categories" },
    { label: categoryName, isCurrent: true },
  ]

  const load = useCallback(async (page = currentPage) => {
    if (isNaN(categoryId)) {
      setError('Некорректный ID категории')
      setLoading(false)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const resp = await getProductsByCategory(categoryId, page, size, filters)
      setPageData(resp)
      setCurrentPage(resp.number)
      
      // Extract available brands from the response
      const brands = new Set<string>()
      resp.content.forEach((product: any) => {
        if (product.brand) {
          brands.add(product.brand)
        }
      })
      setAvailableBrands(Array.from(brands).sort())
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }, [categoryId, currentPage, size, filters])

  useEffect(() => {
    load(0)
  }, [filters, size, categoryId])

  // Load brands on initial mount
  useEffect(() => {
    if (availableBrands.length === 0 && !loading) {
      // Load initial data to get brands
      const loadBrands = async () => {
        try {
          const resp = await getProductsByCategory(categoryId, 0, 50, {})
          const brands = new Set<string>()
          resp.content.forEach((product: any) => {
            if (product.brand) {
              brands.add(product.brand)
            }
          })
          setAvailableBrands(Array.from(brands).sort())
        } catch (e) {
          // Ignore errors for brand loading
        }
      }
      loadBrands()
    }
  }, [categoryId, availableBrands.length, loading])

  const uiProducts: UIProduct[] | undefined = useMemo(() => {
    if (!pageData) return undefined
    return pageData.content.map((p) => ({
      id: p.id,
      brand: p.brand || '-',
      article: p.code || String(p.id),
      description: p.description || p.name,
      stockLocation: p.warehouses?.[0]?.name || 'Главный склад',
      availability: (p.stock ?? 0) > 0 ? 'На складе' : 'Ожидается',
      quantity: (p.stock ?? 0) > 50 ? '>50 шт.' : `${p.stock ?? 0} шт.`,
      price: p.price ?? 0,
      image: p.imageUrl
        ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`)
        : undefined,
    }))
  }, [pageData])

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen pt-24">
        <main className="container mx-auto px-6">
          <div className="pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin" />
              Загрузка товаров...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-100 min-h-screen pt-24">
        <main className="container mx-auto px-6">
          <div className="pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200 mt-8">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
            <p className="text-gray-500">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <h1 className="text-3xl font-bold pt-8">{categoryName}</h1>
        
        <section className="mt-10 mb-10">
          <div className="flex gap-6">
            
            {/* Левая колонка — фильтры */}
            <section className="pt-16 pb-8 w-80 shrink-0">
              <CategoryFiltersSidebar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedBrands={selectedBrands}
                onBrandsChange={setSelectedBrands}
                inStock={inStock}
                onInStockChange={setInStock}
                priceFrom={priceFrom}
                onPriceFromChange={setPriceFrom}
                priceTo={priceTo}
                onPriceToChange={setPriceTo}
                onApply={() => load(0)}
                availableBrands={availableBrands}
              />
            </section>
            
            {/* Правая колонка — карточки */}
            <section className="flex-1">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded mb-4">{error}</div>
              )}
              
              {/* Пустое состояние */}
              {!loading && pageData && pageData.numberOfElements === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
                  <PackageSearch className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Товары не найдены</h3>
                  <p className="text-gray-500 text-center">
                    В категории "{categoryName}" пока нет товаров<br />
                    или попробуйте изменить фильтры поиска.
                  </p>
                </div>
              )}
              
              {/* Товары */}
              {pageData && pageData.numberOfElements > 0 && (
                <ItemCardComponent products={uiProducts} />
              )}
              
              {loading && (
                <div className="text-center py-8 text-gray-500">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin" />
                    Загрузка товаров...
                  </div>
                </div>
              )}

              {/* Пагинация */}
              {pageData && pageData.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button 
                    disabled={currentPage <= 0} 
                    onClick={() => load(currentPage - 1)} 
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                    {currentPage + 1} / {pageData.totalPages}
                  </span>
                  
                  <button 
                    disabled={currentPage >= pageData.totalPages - 1} 
                    onClick={() => load(currentPage + 1)} 
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </section>

          </div>
        </section>
      </main>
    </div>
  )
}
