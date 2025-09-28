import ChevronRightIcon from "@/shared/icons /ChevronRightIcon";

const HeroSection = () => (
  <section className="bg-gray-100 pb-16">
    <div className="container mx-auto px-6">
      <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex items-center min-h-96">
          <div className="flex-1 p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Эксперт в деталях
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Качественные автозапчасти для профессионалов
            </p>
          </div>
          
          <div className="flex-1 relative h-96">
            {/* Placeholder for hero image */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-red-600 opacity-80 rounded-r-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center"
          aria-label="Предыдущий слайд"
        >
          <ChevronRightIcon className="w-6 h-6 text-white rotate-180" />
        </button>
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center"
          aria-label="Следующий слайд"
        >
          <ChevronRightIcon className="w-6 h-6 text-white" />
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className={`w-20 h-2 rounded-full transition-colors ${
                i === 0 ? 'bg-gray-900' : 'bg-gray-400'
              }`}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);
export default HeroSection;