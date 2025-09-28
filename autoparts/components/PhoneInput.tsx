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
import { Input } from "@/components/ui/input"

const countries = [
  { label: "🇷🇺 Россия", value: "ru", code: "+7" },
  { label: "🇰🇿 Казахстан", value: "kz", code: "+7" },
  { label: "🇺🇿 Узбекистан", value: "uz", code: "+998" },
  { label: "🇺🇦 Украина", value: "ua", code: "+380" },
  { label: "🇧🇾 Беларусь", value: "by", code: "+375" },
  { label: "🇰🇬 Кыргызстан", value: "kg", code: "+996" },
  { label: "🇹🇯 Таджикистан", value: "tj", code: "+992" },
  { label: "🇹🇲 Туркменистан", value: "tm", code: "+993" },
  { label: "🇲🇩 Молдова", value: "md", code: "+373" },
  { label: "🇦🇲 Армения", value: "am", code: "+374" },
  { label: "🇬🇪 Грузия", value: "ge", code: "+995" },
  { label: "🇦🇿 Азербайджан", value: "az", code: "+994" },
] as const

type Country = typeof countries[number]

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  onCountryChange?: (country: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export function PhoneInput({ 
  value = "", 
  onChange, 
  onCountryChange,
  placeholder = "123456789",
  className = "",
  error 
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setOpen(false)
    onCountryChange?.(country.value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value.replace(/\D/g, '') // Только цифры
    onChange?.(phoneNumber)
  }

  return (
    <div className="space-y-1">
      <div className="flex space-x-2">
        {/* Country Code Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-32 justify-between px-3"
            >
              <span className="truncate">
                {selectedCountry.code}
              </span>
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Поиск страны..." className="h-9" />
              <CommandList>
                <CommandEmpty>Страна не найдена.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.value}
                      value={country.label}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <span className="flex items-center justify-between w-full">
                        <span>{country.label}</span>
                        <span className="text-gray-500">{country.code}</span>
                      </span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedCountry.value === country.value
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

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={cn(
            "flex-1 focus:ring-2 focus:ring-green-500 focus:border-green-500",
            className
          )}
        />
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-1">
        Полный номер: {selectedCountry.code} {value}
      </p>
    </div>
  )
}
