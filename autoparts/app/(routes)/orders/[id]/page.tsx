import ContributorsOverviewTable from "@/components/ui/contributors-overview-table";

export function DetailedInfoOrder() {
  return (
    <div className="bg-white min-h-screen pt-24">
      <div className="container mx-auto px-6 pt-5">
        <h1 className="text-4xl font-bold text-gray-900">Детальная информация о заказе</h1>
        <p className="text-gray-600 mt-2">
          Здесь вы можете просмотреть детальную информацию о заказе.
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

export default DetailedInfoOrder;
