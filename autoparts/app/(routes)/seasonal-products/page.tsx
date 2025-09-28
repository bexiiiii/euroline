import Breadcrumbs from "@/components/Breadcrumb";
import CategoriesList from "@/components/CategoriesList";

const items = [
  { label: "Главная", href: "/" },
  { label: "Масло и автохимия", isCurrent: true },
];



function HelpPage() {
  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-4xl font-bold pt-4">Масло и автохимия</h1>
              <section className="mt-10 mb-10">
                  <CategoriesList />
              </section>
              
      </main>
    </div>
  );
}

export default HelpPage;
