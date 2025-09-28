
"use client"

import UserIcon from "@/shared/icons /UserIcon";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { RadixDropdownMenu } from "./ProfileDropDownComponent";
import { ShoppingCart, ShoppingCartIcon } from "lucide-react";
import { Customized } from "./PhoneHeader";
import { useAuthStore } from "@/lib/stores/authStore";

const Header = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-[100%] max-w-8xl bg-gray-900/95 backdrop-blur-sm  px-4">
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-20 text-white">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-medium hover:text-orange-500 transition-colors">
              LOGO
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/aboutus" className="hover:text-orange-500 transition-colors">
                О нас
              </Link>
              <Link href="/categories" className="hover:text-orange-500 transition-colors">
                Каталоги
              </Link>
              <Link href="/weekly-product" className="hover:text-orange-500 transition-colors">
                Товар недели
              </Link>
              <Link href="/oil-and-chemicals" className="hover:text-orange-500 transition-colors">
                Масло и автохимия
              </Link>
              <Link href="/contacts" className="hover:text-orange-500 transition-colors">
                Контакты
              </Link>
              <Link href="/partners" className="hover:text-orange-500 transition-colors">
                Партнерам
              </Link>
              <Link href="/news" className="hover:text-orange-500 transition-colors">
                Новости
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Показываем RadixDropdownMenu только если пользователь авторизован */}
            {isAuthenticated && user ? (
              <RadixDropdownMenu />
            ) : (
              <Link href="/auth/login" className="flex items-center">
                <button 
                  className="p-2 hover:text-orange-500 transition-colors"
                  aria-label="Личный кабинет"
                >
                  <UserIcon />
                </button>
              </Link>
            )}
            
            <Link href="/cart">
              <button 
                className="p-2 hover:text-orange-500 transition-colors"
                aria-label="Корзина"
              >
                <ShoppingCartIcon />
              </button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;