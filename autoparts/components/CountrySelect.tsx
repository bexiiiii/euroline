"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import Countries from "world-countries"
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

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const countryOptions = Countries.map((country: any) => ({
  value: country.cca2,
  label: country.name.common,
  flag: country.flag,
})).sort((a: any, b: any) => a.label.localeCompare(b.label))

export function CountrySelect({ value, onChange, placeholder = "Выберите страну", disabled = false }: CountrySelectProps) {
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
          {value ? (
            <>
              <span className="mr-2">
                {countryOptions.find((country: any) => country.value === value)?.flag}
              </span>
              {countryOptions.find((country: any) => country.value === value)?.label}
            </>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Поиск страны..." />
          <CommandList>
            <CommandEmpty>Страна не найдена.</CommandEmpty>
            <CommandGroup>
              {countryOptions.map((country: any) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={() => {
                    onChange(country.value === value ? "" : country.value)
                    setOpen(false)
                  }}
                >
                  <span className="mr-2">{country.flag}</span>
                  {country.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
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
