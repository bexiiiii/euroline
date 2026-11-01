"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Search, LogIn, UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSearchStore } from "@/lib/stores/searchStore"

/** Окно после бесплатного поиска гостя: дальше — только после входа или регистрации. */
export default function GuestSearchLimitModal() {
  const { guestLimitReached, dismissGuestLimit } = useSearchStore()
  const pathname = usePathname()
  const params = useSearchParams()
  const back = encodeURIComponent(`${pathname}${params.toString() ? `?${params}` : ""}`)

  return (
    <Dialog open={guestLimitReached} onOpenChange={(open) => { if (!open) dismissGuestLimit() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Search className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-xl">Лимит поиска исчерпан</DialogTitle>
          <DialogDescription className="text-base">
            Без входа доступен один поиск. Войдите или зарегистрируйтесь, чтобы искать без ограничений,
            видеть цены, остатки на складах и оформлять заказы.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/auth/login?redirect=${back}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2.5 font-medium text-white hover:bg-orange-600"
          >
            <LogIn className="h-4 w-4" /> Войти
          </Link>
          <Link
            href={`/auth/signup?redirect=${back}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-900 hover:bg-gray-50"
          >
            <UserPlus className="h-4 w-4" /> Регистрация
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
