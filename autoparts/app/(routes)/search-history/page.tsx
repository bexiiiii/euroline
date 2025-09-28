"use client"

import Breadcrumbs from "@/components/Breadcrumb"
import { useEffect } from "react"
import { useSearchHistoryStore } from "@/lib/stores/searchHistoryStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History } from "lucide-react"
import PaginationButton from "@/components/PaginationWithPrimaryButton"
import Link from "next/link"

const items = [
  { label: "Главная", href: "/" },
  { label: "История поиска", isCurrent: true },
]

export default function SearchHistoryPage() {
  const { items: rows, isLoading, error, page, totalPages, load } = useSearchHistoryStore()

  useEffect(() => { load(0) }, [load])

  const onPrev = () => { if (page > 0) load(page - 1) }
  const onNext = () => { if (page < totalPages - 1) load(page + 1) }

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-3xl font-bold pt-4">История поиска</h1>

        <section className="bg-gray-100 p-6 rounded-lg mt-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded mb-4">{error}</div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-gray-500">Загрузка...</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
              <History className="w-12 h-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">История пуста</h3>
              <p className="mt-1 text-sm text-gray-500">Выполните поиск, чтобы увидеть историю.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Запрос</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{page * 20 + idx + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/search?q=${encodeURIComponent(row.query)}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {row.query}
                        </Link>
                      </TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString('ru-RU')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-center gap-3 py-4">
                <PaginationButton page={page} totalPages={totalPages} onPageChange={(p)=>load(p)} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
