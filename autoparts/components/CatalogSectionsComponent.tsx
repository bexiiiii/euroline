import { Sidebar } from "@/components/ui/modern-side-bar";


function CatalogSectionsComponent() {
  const catalogItems = [
    "Подбор запчастей по VIN/Frame",
    "Каталоги оригинальных запчастей",
    "Подбор запчастей по марке",
    "Каталоги легковых запчастей",
    "Каталоги грузовых запчастей",
    "Каталоги мотозапчастей",
    "Подбор шин и дисков по марке",
    "Каталог шин",
    "Каталог дисков",
    "Подбор запчастей по размерам",
    "Каталог подшипников",
    "Запчасти для техобслуживания",
    "Каталоги для ТО",
    "Другие каталоги",
    "Каталоги неоригинальных запчастей",
  ];

  return (
    <div className="w-full md:w-2/3 lg:w-3/4 ml-8 pt-6 pb-6">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight flex items-center gap-3">
        Каталоги
      </h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-lg">
        {catalogItems.map((item, idx) => (
          <li
            key={idx}
            className="bg-white/80 transition-all duration-200 rounded-lg px-5 py-3 
                       hover:bg-orange-50 hover:text-orange-700 hover:text-xl font-medium text-gray-800 cursor-pointer"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CatalogSectionsComponent;
