"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, Wrench, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Декоративные элементы на фоне */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-5">
          <Wrench className="w-32 h-32 text-gray-900 rotate-45" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-5">
          <Wrench className="w-40 h-40 text-gray-900 -rotate-12" />
        </div>
        <div className="absolute top-1/2 left-1/4 opacity-5">
          <svg className="w-24 h-24 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      <div className="max-w-4xl w-full text-center relative z-10">
        {/* Иконка с гаечным ключом */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center gap-4">
            {/* 404 с гаечным ключом */}
            <div className="relative">
              <h1 className="text-[120px] md:text-[180px] font-bold text-gray-200 leading-none">
                4
              </h1>
            </div>
            
            <div className="relative">
              {/* Анимированный гаечный ключ в центре нуля */}
              <div className="relative">
                <div className="text-[120px] md:text-[180px] font-bold text-gray-200 leading-none">
                  0
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-bounce">
                    <Wrench className="w-16 h-16 md:w-24 md:h-24 text-orange-600" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <h1 className="text-[120px] md:text-[180px] font-bold text-gray-200 leading-none">
                4
              </h1>
            </div>
          </div>
        </div>

        {/* Заголовок */}
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
          Страница не найдена
        </h2>

        {/* Описание */}
        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          К сожалению, запрашиваемая страница не существует. Возможно, она была перемещена или удалена. 
          Воспользуйтесь поиском или вернитесь на главную страницу.
        </p>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto gap-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </Button>
          
          <Link href="/" className="w-full sm:w-auto">
            <Button 
              size="lg"
              className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Home className="w-5 h-5" />
              На главную
            </Button>
          </Link>

          <Link href="/catalog" className="w-full sm:w-auto">
            <Button 
              variant="outline"
              size="lg"
              className="w-full gap-2 hover:bg-gray-100"
            >
              <Search className="w-5 h-5" />
              Каталог запчастей
            </Button>
          </Link>
        </div>

        {/* Контактная информация */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Нужна помощь? Свяжитесь с нами:</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <a href="tel:+77064267143" className="hover:text-blue-600 transition-colors">
              +7 706 426 7143
            </a>
            <span className="text-gray-300">|</span>
            <a href="mailto:info@euroline.kz" className="hover:text-blue-600 transition-colors">
              info@euroline.kz
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
