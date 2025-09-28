import Link from "next/link";

// Categories Component
const CategoriesSection = () => {
  const categories = [
    { name: 'Амортизаторы', image: '/api/placeholder/300/200', color: 'from-red-500 to-red-600' },
    { name: 'Двигатель', image: '/api/placeholder/300/200', color: 'from-blue-500 to-blue-600' },
    { name: 'Масла и жидкости', image: '/api/placeholder/300/200', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Диски и шины', image: '/api/placeholder/300/200', color: 'from-gray-500 to-gray-600' },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12">
          Популярные категории
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link 
              key={index}
              href={`/category/${category.name.toLowerCase()}`}
              className="group block"
            >
              <div className="relative h-72 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80`} />
                <div className="absolute inset-0 flex items-end">
                  <div className="p-6 w-full">
                    <h3 className="text-white text-xl font-semibold">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;