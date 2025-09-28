import { AboutUsComponent } from "@/components/AboutUscomponent"
import BrandsCarousel from "@/components/BrandsCarousel"
import { AutoPartsBrandsCarousel } from "@/components/ui/autoparts-brands-carousel"
import { AutoPartsPartnersSlider } from "@/components/ui/autoparts-partners-slider"
import { AutoPartsDisplayCards } from "@/components/ui/autoparts-display-cards"
import { Features } from "@/components/ui/features-8"
import { Feature } from "@/components/ui/feature"
import { TiltedScroll } from "@/components/ui/tilted-scroll"
import { FeatureStepsDemo } from "@/components/ui/feature-section-demo"
import { WorkWithUsComponent } from "@/components/WorkWithUsCompnent"


const PartnersPage = () => {
    return (
        <div className="flex flex-col bg-gray-100 flex-1 min-h-screen">
            <main className="flex-1 space-y-16">
                {/* Hero Section with Image Slider */}
                <section>
                    <AutoPartsPartnersSlider />
                </section>
                
                {/* ETP Platform Section with Display Cards */}
                <section>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Main Content */}
                        <div className="flex-1">
                            <AutoPartsDisplayCards />
                        </div>
                        {/* Sidebar */}
                        
                    </div>
                </section>

                {/* Features Section */}
                <section>
                    <Features />
                </section>

                {/* Work With Us Section */}
                <section >
                   
                        <WorkWithUsComponent />
                    
                </section>
                {/* Features Section */}
                <section>
                    <FeatureStepsDemo />
                </section>
            </main>
        </div>
    )
}

export default PartnersPage