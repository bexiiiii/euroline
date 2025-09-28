"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ActivitySelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const activityOptions = [
  { value: "retail", label: "Розничная торговля" },
  { value: "wholesale", label: "Оптовая торговля" },
  { value: "service", label: "Автосервис" },
  { value: "parts_dealer", label: "Дилер автозапчастей" },
  { value: "manufacturer", label: "Производство" },
  { value: "distributor", label: "Дистрибуция" },
  { value: "repair_shop", label: "Ремонтная мастерская" },
  { value: "other", label: "Другое" },
]

export function ActivitySelect({ value, onChange, placeholder = "Выберите вид деятельности", disabled = false }: ActivitySelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
        >
          {value
            ? activityOptions.find((activity) => activity.value === value)?.label
            : placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Поиск деятельности..." />
          <CommandList>
            <CommandEmpty>Деятельность не найдена.</CommandEmpty>
            <CommandGroup>
              {activityOptions.map((activity) => (
                <CommandItem
                  key={activity.value}
                  value={activity.label}
                  onSelect={() => {
                    onChange(activity.value === value ? "" : activity.value)
                    setOpen(false)
                  }}
                >
                  {activity.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === activity.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
