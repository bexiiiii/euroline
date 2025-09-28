"use client"

import { useState } from "react"
import PhoneInput from "react-phone-number-input"
import { cn } from "@/lib/utils"

interface PhoneInputComponentProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  defaultCountry?: string
  disabled?: boolean
}

export function PhoneInputComponent({ 
  value, 
  onChange, 
  placeholder = "Введите номер телефона",
  className,
  defaultCountry = "KZ",
  disabled = false
}: PhoneInputComponentProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry as any}
          value={value}
          onChange={(value) => onChange(value || "")}
          placeholder={placeholder}
          disabled={disabled}
          className="flex w-full"
          limitMaxLength={true}
          flagComponent={({ country, flagUrl, ...rest }) => (
            <img 
              {...rest}
              src={flagUrl} 
              alt={country}
              className="inline-block w-4 h-3 object-cover"
            />
          )}
          style={{
            '--PhoneInputCountryFlag-aspectRatio': '1.333',
            '--PhoneInputCountryFlag-height': '0.75rem',
            '--PhoneInputCountrySelectArrow-color': '#6b7280',
            '--PhoneInputCountrySelectArrow-width': '0.5rem',
            '--PhoneInputCountrySelectArrow-height': '0.5rem',
            border: 'none',
            background: 'transparent',
          } as any}
        />
      </div>
    </div>
  )
}
