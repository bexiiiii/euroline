import Link from "next/link";

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h3 className="text-2xl font-semibold text-orange-500 mb-6">
            Компания
          </h3>
          <nav className="space-y-3">
            <Link href="/about" className="block hover:text-orange-500 transition-colors">
              О компании
            </Link>
            <Link href="/news" className="block hover:text-orange-500 transition-colors">
              Новости
            </Link>
            <Link href="/contacts" className="block hover:text-orange-500 transition-colors">
              Контакты
            </Link>
          </nav>
        </div>
        
        <div>
          <h3 className="text-2xl font-semibold text-orange-500 mb-6">
            Партнерство
          </h3>
          <nav className="space-y-3">
            <Link href="/partners" className="block hover:text-orange-500 transition-colors">
              Партнерам
            </Link>
            <Link href="/etp" className="block hover:text-orange-500 transition-colors">
              Электронная торговая платформа
            </Link>
            <Link href="/parts-selection" className="block hover:text-orange-500 transition-colors">
              Подбор запчастей
            </Link>
          </nav>
        </div>
        
        <div>
          <nav className="space-y-3">
            <Link href="/privacy" className="block hover:text-orange-500 transition-colors">
              Обработка персональных данных
            </Link>
            <Link href="/registration-data" className="block hover:text-orange-500 transition-colors">
              Контактные и регистрационные данные
            </Link>
            <Link href="/warranty" className="block hover:text-orange-500 transition-colors">
              Гарантийная политика
            </Link>
            <Link href="/returns" className="block hover:text-orange-500 transition-colors">
              Порядок приемки и возврата товара
            </Link>
          </nav>
        </div>
      </div>
      
      <hr className="border-gray-700 my-8" />
      
      <div className="text-center">
        <p className="text-gray-400">
          ©2025 Все права защищены
        </p>
      </div>
    </div>
  </footer>
);
export default Footer;