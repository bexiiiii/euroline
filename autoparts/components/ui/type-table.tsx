"use client"

import * as React from "react"
import { InfoIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SearchRecord {
  query: string
  time: string
  date: string
  description?: string
  link?: string
}

interface SearchHistoryTableProps extends React.HTMLAttributes<HTMLDivElement> {
  data: SearchRecord[]
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger>
        <InfoIcon className="size-4 cursor-pointer text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="prose max-h-[400px] min-w-[220px] max-w-[400px] overflow-auto text-sm prose-no-margin">
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function SearchHistoryTable({ data, className, ...props }: SearchHistoryTableProps) {
  return (
    <div 
      className={cn(
        "prose my-6 overflow-auto prose-no-margin rounded-xl border bg-background",
        className
      )}
      {...props}
    >
      <table className="w-full whitespace-nowrap text-sm text-muted-foreground">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="w-[45%] p-4 text-left">Поисковый запрос</th>
            <th className="w-[25%] p-4 text-left border-l">Время</th>
            <th className="w-[20%] p-4 text-left border-l">Дата</th>
            <th className="w-[10%] p-4 text-left border-l">Инфо</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={index} className="border-b last:border-0">
              <td className="p-4">
                <code className="rounded-md bg-primary/10 p-1 text-primary">
                  {entry.query}
                </code>
              </td>
              <td className="p-4 border-l">
                <span className="bg-secondary p-1 rounded-md">
                  {entry.time}
                </span>
              </td>
              <td className="p-4 border-l">
                <span className="bg-secondary p-1 rounded-md">
                  {entry.date}
                </span>
              </td>
              <td className="p-4 border-l text-center">
                {(entry.description || entry.link) ? (
                  <Info>
                    {entry.description && <div>{entry.description}</div>}
                    {entry.link && (
                      <div>
                        <Link href={entry.link} className="text-blue-500 underline">
                          Подробнее
                        </Link>
                      </div>
                    )}
                  </Info>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
