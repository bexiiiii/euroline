import { NewsComponent } from "@/components/NewsComponent"

const NewsPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 lg:pt-36 pb-8 md:pb-12 lg:pb-16">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 lg:mb-10 text-center">
          Новости компании
        </h1>
        <section>
          <NewsComponent />
        </section>
      </main>
    </div>
  )
}

export default NewsPage