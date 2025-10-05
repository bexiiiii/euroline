"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumb";
import { API_BASE } from "@/lib/api/base";
import Link from "next/link";
import { FaBatteryFull, FaLightbulb, FaMobile, FaFire, FaCar } from 'react-icons/fa';

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
  { label: "Масло и автохимия", href: "/oil-and-chemicals" },
  { label: "Сезонные товары", isCurrent: true },
];

// Icon mapping for categories
const getIconForCategory = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('двигатель') || lowerName.includes('engine')) return FaCar;
  if (lowerName.includes('тормоз') || lowerName.includes('brake')) return FaFire;
  if (lowerName.includes('подвеска') || lowerName.includes('suspension')) return FaMobile;
  if (lowerName.includes('масла') || lowerName.includes('oil')) return FaLightbulb;
  if (lowerName.includes('электрика') || lowerName.includes('electric')) return FaBatteryFull;
  return FaCar; // default
};

// Map category names to URL slugs
const getCategorySlug = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('двигатель')) return 'engines';
  if (lowerName.includes('тормоз')) return 'brake-pads';
  if (lowerName.includes('подвеска')) return 'suspension';
  if (lowerName.includes('масла')) return 'oils';
  if (lowerName.includes('электрика')) return 'electronics';
  // Fallback to simple slug
  return name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

function CategoryCard({ category }: { category: Category }) {
  const Icon = getIconForCategory(category.name);
  const href = `/categories/${category.id}`;
  
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center text-center">
          <Icon className="w-12 h-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
          <p className="text-sm text-gray-500">{category.productCount} товаров</p>
        </div>
      </div>
    </Link>
  );
}

function SeasonalProductsPage() {
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
        
        // Find "Сезонные товары" category and get its subcategories
        const seasonalCategory = allCategories.find(cat => 
          cat.name.toLowerCase().includes('сезонные товары') || cat.slug === 'сезонные-товары'
        );
        
        if (seasonalCategory && seasonalCategory.subcategories.length > 0) {
          setCategories(seasonalCategory.subcategories);
        } else {
          setCategories([]);
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки категорий');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-4xl font-bold pt-4">Сезонные товары</h1>
        
        <section className="mt-10 mb-10">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin" />
                Загрузка категорий...
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
              Ошибка: {error}
            </div>
          )}
          
          {!loading && !error && categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Категории не найдены
            </div>
          )}
          
          {!loading && categories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SeasonalProductsPage;
