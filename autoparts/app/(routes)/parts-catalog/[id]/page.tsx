import Breadcrumbs from "@/components/Breadcrumb";

import { VehicleSelectionForm } from "@/components/VehicleSelectionForm";

const items = [
  { label: "Главная", href: "/" },
  { label: "Каталоги", href: "/catalogs" },
  { label: "Kamaz", isCurrent: true },
];

export function PartsCatalogPage() {
  return (
   <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
          <h1 className="text-4xl font-bold text-gray-900 pt-4">Каталоги грузовых запчастей на KAMAZ</h1>
          <section>
            
            
            {/* Vehicle Selection Form */}
            <div className="mt-17 bg-gray-50 p-6 rounded-lg mb-8 ">
              
                <VehicleSelectionForm />
              
            </div>
          </section>
        </div>
      </main>
   </div>
  );
}

export default PartsCatalogPage;