import ReturnsStatusTable from "@/components/ReturnsStatusTable";

export function invoicesStatus() {
  return (
     <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <h1 className="text-4xl font-bold pt-4">Статус возвратов</h1>
        <p className="text-lg font-medium pt-2">Товары на возврат</p>

        <section>
          <div className="border p-4 mt-30 rounded-md bg-gray-50 mb-10 pt-10">
            <ReturnsStatusTable />
          </div>
        </section>
      </main>
    </div>  
  );
}

export default invoicesStatus;
