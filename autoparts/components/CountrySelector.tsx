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

const countries = [
  { label: "🇷🇺 Россия", value: "russia" },
  { label: "🇰🇿 Казахстан", value: "kazakhstan" },
  { label: "🇺🇿 Узбекистан", value: "uzbekistan" },
  { label: "🇺🇦 Украина", value: "ukraine" },
  { label: "🇧🇾 Беларусь", value: "belarus" },
  { label: "🇰🇬 Кыргызстан", value: "kyrgyzstan" },
  { label: "🇹🇯 Таджикистан", value: "tajikistan" },
  { label: "🇹🇲 Туркменистан", value: "turkmenistan" },
  { label: "🇲🇩 Молдова", value: "moldova" },
  { label: "🇦🇲 Армения", value: "armenia" },
  { label: "🇬🇪 Грузия", value: "georgia" },
  { label: "🇦🇿 Азербайджан", value: "azerbaijan" },
] as const

type Country = typeof countries[number]

interface CountrySelectorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export function CountrySelector({ 
  value, 
  onChange, 
  placeholder = "Выберите страну",
  className = "",
  error 
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false)
  
  const selectedCountry = countries.find((country) => country.value === value)

  const handleSelect = (country: Country) => {
    onChange?.(country.value)
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
              !selectedCountry && "text-muted-foreground",
              className
            )}
          >
            {selectedCountry ? selectedCountry.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Поиск страны..." className="h-9" />
            <CommandList>
              <CommandEmpty>Страна не найдена.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => handleSelect(country)}
                  >
                    {country.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCountry?.value === country.value
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
