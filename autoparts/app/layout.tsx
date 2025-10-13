import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import Header from "@/components/Header";
import { Footerdemo } from "@/components/ui/footer-section";
import MobileMenu from "@/components/PhoneHeader";
import { Toaster } from "sonner";
import { AuthInitializer } from "@/components/AuthInitializer";
import { VehicleProvider } from "@/context/VehicleContext";
import { MobileExperienceNotice } from "@/components/MobileExperienceNotice";
import { API_BASE } from "@/lib/api/base";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Euroline",
  description: "Крупнейший магазин грузовых запчастей в Казахстане",
};

async function fetchMaintenanceStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/system/maintenance`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return Boolean(data?.enabled);
  } catch (error) {
    console.error("Failed to fetch maintenance status", error);
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const maintenanceEnabled = await fetchMaintenanceStatus();

  if (maintenanceEnabled) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 text-gray-800`}
        >
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="max-w-xl text-center space-y-6 rounded-2xl border-1 border-gray-300 bg-white p-10 ">
              <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-3xl">
                ⚙️
              </div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Сайт на техническом обслуживании
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                Мы временно закрыли доступ для проведения важных обновлений. Пожалуйста,
                загляните позже — мы вернёмся, как только всё будет готово.
              </p>
              <p className="text-sm text-gray-500">
                Если вам срочно нужна помощь, свяжитесь с нашей службой поддержки{" "}
                <a href="tel:+77081234567" className="text-brand-600 hover:underline">
                  +7 (706) 426-71-43
                </a>
              </p>
            </div>
          </main>
        </body>
      </html>
    );
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <VehicleProvider>
          <AuthInitializer />
          <MobileExperienceNotice />
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* Мобильное меню снизу (показывается только на мобильных разрешениях) */}
          <div className="md:hidden fixed inset-x-0 bottom-0 z-40">
            <MobileMenu />
          </div>

          <Footerdemo />
          <Toaster />
        </VehicleProvider>
      </body>
    </html>
  );
}
