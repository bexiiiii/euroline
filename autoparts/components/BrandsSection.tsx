import Link from "next/link";

const BrandsSection = () => {
  const brands = ['Brand 1', 'Brand 2', 'Brand 3', 'Brand 4'];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12">
          Популярные бренды
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand, index) => (
            <Link
              key={index}
              href={`/brand/${brand.toLowerCase().replace(' ', '-')}`}
              className="group block"
            >
              <div className="h-96 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {brand}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;