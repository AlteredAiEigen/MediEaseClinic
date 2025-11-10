"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
  modifiers?: any
  modifiersClassNames?: any
}

function CustomCalendar({
  selected,
  onSelect,
  className,
  modifiers,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())

  // Generate calendar data
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    // First day of the calendar grid (might be from previous month)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    // Generate 6 weeks worth of days (42 days total)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return { days, firstDay, lastDay }
  }

  const { days, firstDay, lastDay } = generateCalendarDays(currentDate)

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selected && date.toDateString() === selected.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date >= firstDay && date <= lastDay
  }

  const hasAppointment = (date: Date) => {
    if (!modifiers?.hasAppointment) return false
    return modifiers.hasAppointment.some((appointmentDate: Date) => {
      return appointmentDate.toDateString() === date.toDateString()
    })
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className={cn("w-full", className)}>
      <div className="calendar-container">
        {/* Calendar Header */}
        <div className="calendar-header">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="calendar-nav-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="calendar-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="calendar-nav-button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Names */}
        <div className="calendar-day-names">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-name">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {days.map((date, index) => {
            const today = isToday(date)
            const selected = isSelected(date)
            const currentMonth = isCurrentMonth(date)
            const appointment = hasAppointment(date)

            return (
              <button
                key={index}
                onClick={() => onSelect && onSelect(date)}
                className={cn(
                  "calendar-day",
                  {
                    "calendar-day-today": today,
                    "calendar-day-selected": selected,
                    "calendar-day-other-month": !currentMonth,
                    "calendar-day-has-appointment": appointment,
                  }
                )}
                disabled={!currentMonth}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

        {/* Jump to Today Button */}
        <div className="calendar-footer">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              setCurrentDate(today)
              onSelect && onSelect(today)
            }}
            className="calendar-today-button"
          >
            Jump to Today
          </Button>
        </div>
      </div>

      <style jsx>{`
        .calendar-container {
          width: 100%;
          max-width: 100%;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          padding: 1rem;
          font-family: inherit;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          overflow: hidden;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          margin-bottom: 0.5rem;
        }

        .calendar-nav-button {
          width: 2rem;
          height: 2rem;
          padding: 0;
          border-radius: calc(var(--radius) - 2px);
          flex-shrink: 0;
        }

        .calendar-month {
          font-weight: 600;
          font-size: 1rem;
          color: hsl(var(--foreground));
          text-align: center;
          flex: 1;
          min-width: 0;
        }

        .calendar-day-names {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.125rem;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid hsl(var(--border));
        }

        .calendar-day-name {
          text-align: center;
          font-weight: 600;
          font-size: 0.75em;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          padding: 0.375rem 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.125rem;
          margin-bottom: 1rem;
        }

        .calendar-day {
          width: 100%;
          aspect-ratio: 1;
          max-width: 2.25rem;
          border: none;
          border-radius: calc(var(--radius) - 2px);
          background: none;
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
          margin: 0 auto;
        }

        .calendar-day:hover:not(:disabled) {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }

        .calendar-day:disabled {
          color: hsl(var(--muted-foreground));
          cursor: not-allowed;
        }

        .calendar-day-today {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          font-weight: 600;
        }

        .calendar-day-selected {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-weight: 600;
        }

        .calendar-day-has-appointment {
          background-color: hsl(220, 89%, 96%);
          color: hsl(220, 84%, 33%);
          font-weight: 600;
          border: 1px solid hsl(220, 84%, 80%);
        }

        .calendar-day-has-appointment:hover {
          background-color: hsl(220, 89%, 92%);
          color: hsl(220, 84%, 33%);
        }

        .calendar-day-has-appointment.calendar-day-selected {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }

        .calendar-day-has-appointment.calendar-day-today {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          border-color: hsl(var(--accent));
        }

        .calendar-day-other-month {
          color: hsl(var(--muted-foreground));
        }

        .calendar-footer {
          display: flex;
          justify-content: center;
          padding-top: 0.5rem;
        }

        .calendar-today-button {
          font-size: 0.875rem;
          width: 100%;
          max-width: 120px;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .calendar-container {
            padding: 0.75rem;
          }

          .calendar-day {
            max-width: 2rem;
            font-size: 0.8rem;
          }

          .calendar-month {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}
CustomCalendar.displayName = "Calendar"

export { CustomCalendar as Calendar }
