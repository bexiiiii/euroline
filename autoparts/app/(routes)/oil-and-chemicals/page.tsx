"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumb";
import OilAndChemicalsGrid from "@/components/OilAndChemicalsGrid";
import { API_BASE } from "@/lib/api/base";

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
  subcategories: Category[];
}

const items = [
  { label: "Главная", href: "/" },
  { label: "Масло и автохимия", isCurrent: true },
];

function HelpPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/admin/categories/tree`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const allCategories: Category[] = await response.json();
        setCategories(allCategories);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки категорий');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Find specific categories dynamically
  const seasonalCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('сезонные') || cat.slug.includes('сезонные')
  );
  
  const autoChemistryCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('автохимия') || cat.slug.includes('автохимия')
  );
  
  const oilsCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('масла и технические') || 
    cat.slug.includes('масла-и-технические')
  );
  
  const tiresCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('шины') || cat.slug.includes('шины')
  );
  
  const wipersCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('щетки стеклоочистителя') || 
    cat.slug.includes('щетки-стеклоочистителя')
  );

  if (loading) {
    return (
      <div className="bg-white min-h-screen pt-20 md:pt-24">
        <main className="container mx-auto px-4 md:px-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin" />
              Загрузка категорий...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen pt-20 md:pt-24">
        <main className="container mx-auto px-4 md:px-6">
          <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
            Ошибка: {error}
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="bg-white min-h-screen pt-20 md:pt-24">
      <main className="container mx-auto px-4 md:px-6">
        <div className="pt-3 md:pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold pt-3 md:pt-4">Масло и автохимия</h1>
        <section className="mt-6 md:mt-8 lg:mt-10 mb-6 md:mb-8 lg:mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
            {/* Сезонные товары */}
            {seasonalCategory && (
              <OilAndChemicalsGrid
                title={seasonalCategory.name}
                link="/seasonal-products"
                mainImage="/oil-and-chemicals/Sezonnie_tovary_211124.jpg"
                subcategories={seasonalCategory.subcategories.slice(0, 4).map(subcat => ({
                  title: subcat.name,
                  image: `/oil-and-chemicals/image_1${seasonalCategory.subcategories.indexOf(subcat) + 1}.jpg`,
                  href: `/categories/${subcat.id}`
                }))}
              />
            )}
            
            {/* Автохимия */}
            {autoChemistryCategory && (
              <OilAndChemicalsGrid
                title={autoChemistryCategory.name}
                link="/auto-chemicals"
                mainImage="/oil-and-chemicals/Avtohimia_211124.jpg"
                subcategories={autoChemistryCategory.subcategories.slice(0, 4).map(subcat => ({
                  title: subcat.name,
                  image: `/oil-and-chemicals/image_2${autoChemistryCategory.subcategories.indexOf(subcat) + 1}.jpg`,
                  href: `/categories/${subcat.id}`
                }))}
              />
            )}
            
            {/* Масла и технические жидкости */}
            {oilsCategory && (
              <OilAndChemicalsGrid
                title={oilsCategory.name}
                link="/oils-and-fluids"
                mainImage="/oil-and-chemicals/Masla_211124.jpg"
                subcategories={oilsCategory.subcategories.slice(0, 4).map(subcat => ({
                  title: subcat.name,
                  image: `/oil-and-chemicals/image_3${oilsCategory.subcategories.indexOf(subcat) + 1}.jpg`,
                  href: `/categories/${subcat.id}`
                }))}
              />
            )}
            
            {/* Шины */}
            {tiresCategory && (
              <OilAndChemicalsGrid
                title={tiresCategory.name}
                link={`/categories/${tiresCategory.id}`}
                mainImage="/oil-and-chemicals/Shiny_211124.jpg"
              />
            )}
            
            {/* Щетки стеклоочистителя */}
            {wipersCategory && (
              <OilAndChemicalsGrid
                title={wipersCategory.name}
                link={`/categories/${wipersCategory.id}`}
                mainImage="/oil-and-chemicals/Shetky_211124.jpg"
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default HelpPage;
