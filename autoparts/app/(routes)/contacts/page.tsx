import { GlobeComponent } from "@/components/ClobeComponent";
import YandexMapShop from "@/components/YandexMapShop";

export default function ContactsPage() {
    return (
       <div className="flex flex-col min-h-screen container mx-auto px-4">
        <main className="flex-1 space-y-16 py-10">
            <section>
                <h1 className="text-4xl md:text-4xl sm:text-2xl font-bold text-gray-700 text-left mt-24">Контакты</h1>
                <div className="w-full max-w-8xl bg-gray-700 rounded-xl p-8 mb-12 py-12 flex flex-col md:flex-row md:items-start md:justify-start gap-8 shadow-lg mt-8 border">
                    <div>
                        <h2 className="text-2xl text-white font-bold mb-4">Главный офис</h2>
                        <div className="space-y-2 text-orange-500 text-base">
                            <div className="font-semibold">Euroline</div>
                            <div>г. Алматы, пр. Суюнбая 2, к. 4</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-base ml-auto">
                        <a href="tel:+77273307552" className="text-orange-500 hover:underline font-semibold">
                            +7 727 330 75 52
                        </a>
                        <a href="mailto:cc@euroline.com.kz" className="text-orange-500 hover:underline font-semibold">
                            cc@euroline.com.kz
                        </a>
                    </div>
                </div>
            </section>
            <section>
                <GlobeComponent />
            </section>
            <section>
                 <YandexMapShop />
            </section>
       </main>
       </div>
    );
}
