import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

// Inter с кириллицей: Outfit не содержит кириллических глифов, и русский текст
// падал на системный шрифт, смешиваясь с латиницей и цифрами.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Админ-панель Euroline",
    template: "%s | Админ-панель Euroline",
  },
  description: "Панель управления интернет-магазином автозапчастей Euroline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} ${inter.variable} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
