import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  RangeCalendar,
} from "@/components/ui/calendar"
import {
  DatePickerContent,
  DateRangePicker,
} from "@/components/ui/date-range-picker"
import { DateInput } from "@/components/ui/datefield"
import { FieldGroup } from "@/components/ui/field"
import { useState } from "react"
import type { RangeValue } from "@react-types/shared"
import type { DateValue } from "@react-types/datepicker"

export function CalendarComponent({
  selectedRange,
  setSelectedRange,
}: {
  selectedRange: RangeValue<DateValue> | null
  setSelectedRange: (range: RangeValue<DateValue> | null) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <DateRangePicker
      isOpen={open}
      onOpenChange={setOpen}
      value={selectedRange}
      onChange={(range) => {
        setSelectedRange(range)
        setOpen(false)
      }}
      className="min-w-[320px] space-y-1 relative"
    >
     
      <FieldGroup>
        <DateInput variant="ghost" slot="start" />
        <span className="px-2 text-sm text-muted-foreground">–</span>
        <DateInput className="flex-1" variant="ghost" slot="end" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="mr-1 size-6 data-[focus-visible]:ring-offset-0"
        >
          <CalendarIcon className="size-4" />
        </Button>
      </FieldGroup>

      {open && (
         <DatePickerContent className="absolute z-50 mt-2 bg-white shadow-lg rounded-md border">
          <RangeCalendar>
            <CalendarHeading />
            <CalendarGrid>
              <CalendarGridHeader>
                {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => <CalendarCell date={date} />}
              </CalendarGridBody>
            </CalendarGrid>
          </RangeCalendar>
        </DatePickerContent>
      )}
    </DateRangePicker>
  )
}
