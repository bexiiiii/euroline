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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  
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
