import { Announcement } from "@/components/Announcement";
import ReturnTableComponent from "@/components/ReturnTableComponent";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import Link from "next/link";



export function returns() {
  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <h1 className="text-4xl font-bold pt-4">Возвраты</h1>
        <Link href="/invoices-status" >
          <div className="flex justify-end items-center mt-4 mb-6">
            <InteractiveHoverButton />
          </div>
        </Link>
        <p className="text-2xl font-bold pt-2 text-center text-red-600 mt-20 ">ВНИМАНИЕ</p>
        <h1 className="text-lg font-semibold pt-2">Уважаемый партнёр! При выявлении расхождений при приеме товара по количеству и качеству, ассортименту и комплектности необходимо оформить заявку на возврат в личном кабинете, а также незамедлительно известить отдел рекламаций Поставщика способами:
          <br />1. Электронная почта service@alatrade.com.kz
          <br />2. Представителя Поставщика (курирующего менеджера).</h1>

        <section className="mt-6">
          <div>
            <Announcement />
          </div>


          {/* Здесь будет список возвратов */}
          <div className="mt-4">
            {/* Пример возврата */}
            <div className="border p-4 mb-10 rounded-md bg-gray-50 ">
              <h2 className="text-xl font-semibold">Список возвратов</h2>
              <ReturnTableComponent />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default returns;
