import Breadcrumbs from "@/components/Breadcrumb";
import ContributorsOverviewTable from "@/components/ui/contributors-overview-table";

const items = [
  { label: "Главная", href: "/" },
  { label: "История заказов", isCurrent: true },
];

export default function OrderHistoryPage() {
  return (
    <div className="bg-white min-h-screen pt-24">
      <div className="container mx-auto px-6 pt-5">
        <Breadcrumbs items={items} />
        <h1 className="text-4xl font-bold text-gray-900 pt-4">Все заказы</h1>
        <p className="text-gray-600 mt-2">
          Здесь вы можете просмотреть историю всех ваших заказов.
        </p>
      </div>

      <main className="mx-auto px-6 max-w-[1600px]">
        <section className="mt-17 mb-10">
          <ContributorsOverviewTable />
        </section>
      </main>
    </div>
  );
}
