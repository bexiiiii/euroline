import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://euroline.1edu.kz";

const ogImage = "/images/track_placeholder.png";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Euroline",
  legalName: "Euroline",
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+7-706-426-71-43",
    contactType: "customer service",
    availableLanguage: ["ru", "kk"],
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "KZ",
  },
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Euroline",
  url: siteUrl,
  inLanguage: "ru",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Euroline — грузовые запчасти и автотовары по Казахстану",
    template: "%s | Euroline",
  },
  description:
    "Euroline — крупнейший поставщик грузовых запчастей, масел и автохимии для коммерческого транспорта в Казахстане. Подбор, консультации и доставка по всей стране.",
  keywords: [
    "грузовые запчасти",
    "автозапчасти Казахстан",
    "масла и автохимия",
    "Euroline",
    "коммерческий транспорт",
  ],
  authors: [{ name: "Euroline" }],
  creator: "Euroline",
  publisher: "Euroline",
  category: "Automotive",
  applicationName: "Euroline",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: siteUrl,
    siteName: "Euroline",
    title: "Euroline — грузовые запчасти и автохимия для бизнеса",
    description:
      "Грузовые запчасти, масла и автохимия для коммерческого транспорта. Поддержка экспертов и доставка по Казахстану.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Euroline — магазин грузовых запчастей и автохимии",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Euroline — грузовые запчасти и автохимия для бизнеса",
    description:
      "Оригинальные запчасти и расходники для коммерческих автомобилей с доставкой по Казахстану.",
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
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
  children: ReactNode;
}>) {
  const maintenanceEnabled = await fetchMaintenanceStatus();

  if (maintenanceEnabled) {
    return (
      <html lang="ru" suppressHydrationWarning>
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 text-gray-800`}
        >
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="max-w-xl text-center space-y-6 rounded-2xl border border-gray-200 bg-white p-10 shadow-lg">
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
                <a href="tel:+77064267143" className="text-brand-600 hover:underline">
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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={siteUrl} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white text-slate-900`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:-translate-y-12 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 shadow-lg"
        >
          Перейти к основному содержимому
        </a>
        <VehicleProvider>
          <AuthInitializer />
          <MobileExperienceNotice />
          <Header />
          <main id="main-content" className="flex-1 flex flex-col" role="main">
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
