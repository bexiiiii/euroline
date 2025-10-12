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

  // Check authentication based on token, not user state
  useEffect(() => {
    // Function to check token that runs immediately and then every 5 seconds
    const checkAuth = () => {
      const isAuth = checkAuthentication();
      
      // Update state only if it changed
      if (isAuth !== isAuthorized) {
        setIsAuthorized(isAuth);
        
        if (!isAuth) {
          // Set delay for redirect
          setTimeout(() => {
            router.push("/signin");
          }, 100);
        }
      }
    };
    
    // Perform check immediately
    checkAuth();
    
    // Set up interval for periodic token check
    const interval = setInterval(checkAuth, 5000);
    
    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [isAuthorized, router]);

  // If authentication is being checked, show loader
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // If not authenticated, don't show content
  // (redirect is already happening in useEffect)
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Redirecting to login page...</p>
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
        <div className="p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-6">
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
