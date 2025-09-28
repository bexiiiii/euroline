import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

import { cn } from '@/lib/utils'

type Props = {
  page?: number // zero-based
  totalPages?: number
  onPageChange?: (page: number) => void
}

const PaginationButton = ({ page, totalPages, onPageChange }: Props) => {
  // fallback to old static rendering if no paging provided
  if (page === undefined || totalPages === undefined || !onPageChange) {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href='#' />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#'>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href='#'
              isActive
              className={cn(
                buttonVariants({ variant: 'default', size: 'icon' }),
                'hover:!text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/90 !shadow-none dark:border-transparent'
              )}
            >
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#'>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href='#' />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  const current = Math.max(0, Math.min(page, Math.max((totalPages ?? 1) - 1, 0)))

  // build simple window of pages around current
  const pages: number[] = []
  const total = Math.max(totalPages, 1)
  const start = Math.max(0, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (start > 0) pages.unshift(0)
  if (end < total - 1) pages.push(total - 1)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            onClick={(e) => { e.preventDefault(); if (current > 0) onPageChange(current - 1) }}
          />
        </PaginationItem>
        {pages.map((p, idx) => (
          <PaginationItem key={`${p}-${idx}`}>
            <PaginationLink
              href='#'
              isActive={p === current}
              onClick={(e) => { e.preventDefault(); onPageChange(p) }}
              className={p === current ? cn(
                buttonVariants({ variant: 'default', size: 'icon' }),
                'hover:!text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/90 !shadow-none dark:border-transparent'
              ) : undefined}
            >
              {p + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href='#'
            onClick={(e) => { e.preventDefault(); if (current < total - 1) onPageChange(current + 1) }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationButton
