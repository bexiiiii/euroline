import { AboutUsComponent } from "@/components/AboutUscomponent"
import BrandsCarousel from "@/components/BrandsCarousel"
import { Feature } from "@/components/ui/feature"
import { AutoPartsBrandsCarousel } from "@/components/ui/autoparts-brands-carousel"

const AboutusPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="flex-1 space-y-12 py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AboutUsComponent />
        </div>

        <section>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Feature />
          </div>
        </section>

        <section className="text-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Популярные бренды</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6 text-sm sm:text-base">
              Понимая потребность рынка в деталях с гарантированной надежностью для профессионального обслуживания автомобилей, компания развивает бренды автокомпонентов, смазочных материалов и аккумуляторов.
            </p>

            {/* Make carousels horizontally scrollable on small screens */}
            <div className="space-y-6">
              <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide px-4">
                <div className="inline-block w-full">
                  <BrandsCarousel />
                </div>
              </div>

              <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide px-4">
                <div className="inline-block w-full">
                  <AutoPartsBrandsCarousel />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AboutusPage
