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

const activities = [
  { label: "Розничная торговля", value: "retail" },
  { label: "Оптовая торговля", value: "wholesale" },
  { label: "Автосервис", value: "autoservice" },
  { label: "Производство", value: "manufacturing" },
  { label: "Логистика", value: "logistics" },
  { label: "Дистрибуция", value: "distribution" },
  { label: "Импорт/Экспорт", value: "import_export" },
  { label: "Другое", value: "other" },
] as const

type Activity = typeof activities[number]

interface ActivitySelectorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export function ActivitySelector({ 
  value, 
  onChange, 
  placeholder = "Выберите вид деятельности",
  className = "",
  error 
}: ActivitySelectorProps) {
  const [open, setOpen] = useState(false)
  
  const selectedActivity = activities.find((activity) => activity.value === value)

  const handleSelect = (activity: Activity) => {
    onChange?.(activity.value)
    setOpen(false)
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              !selectedActivity && "text-muted-foreground",
              className
            )}
          >
            {selectedActivity ? selectedActivity.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Поиск деятельности..." className="h-9" />
            <CommandList>
              <CommandEmpty>Деятельность не найдена.</CommandEmpty>
              <CommandGroup>
                {activities.map((activity) => (
                  <CommandItem
                    key={activity.value}
                    value={activity.label}
                    onSelect={() => handleSelect(activity)}
                  >
                    {activity.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedActivity?.value === activity.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
