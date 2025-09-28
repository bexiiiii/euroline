"use client"

import PhoneInput, { E164Number } from "react-phone-number-input"
import { cn } from "@/lib/utils"
import "react-phone-number-input/style.css"

interface PhoneInputComponentProps {
  value?: E164Number
  onChange?: (value: E164Number | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function PhoneInputComponent({ 
  className, 
  placeholder = "Введите номер телефона", 
  ...props 
}: PhoneInputComponentProps) {
  return (
    <PhoneInput
      {...props}
      placeholder={placeholder}
      defaultCountry="RU"
      countries={["RU", "KZ", "UZ", "UA", "BY", "KG", "TJ", "TM", "MD", "AM", "GE", "AZ"]}
      className={cn("phone-input", className)}
      inputComponent={({ className, ...inputProps }) => (
        <input
          {...inputProps}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
      )}
    />
  )
}
