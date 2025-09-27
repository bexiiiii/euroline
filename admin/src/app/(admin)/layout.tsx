"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuthContext, checkAuthentication } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { loading } = useAuthContext();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  // Проверяем аутентификацию на основе токена, а не на состоянии пользователя
  useEffect(() => {
    // Функция для проверки токена, которая выполняется сразу и затем каждые 5 секунд
    const checkAuth = () => {
      console.log("Проверяем наличие токена...");
      const isAuth = checkAuthentication();
      console.log("Результат проверки аутентификации:", isAuth);
      
      // Обновляем состояние только если оно изменилось
      if (isAuth !== isAuthorized) {
        setIsAuthorized(isAuth);
        
        if (!isAuth) {
          console.log("Токен не найден, перенаправляем на страницу входа");
          // Устанавливаем задержку для перенаправления
          setTimeout(() => {
            router.push("/signin");
          }, 100);
        }
      }
    };
    
    // Выполняем проверку сразу
    checkAuth();
    
    // Настраиваем интервал для периодической проверки токена
    const interval = setInterval(checkAuth, 5000);
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(interval);
  }, [isAuthorized, router]);

  // Если идет проверка аутентификации, показываем загрузчик
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Проверка аутентификации...</p>
      </div>
    );
  }

  // Если не аутентифицирован, не показываем содержимое
  // (редирект уже выполняется в useEffect)
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Перенаправление на страницу входа...</p>
      </div>
    );
  }
  
  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
