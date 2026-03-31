import { useDateRange, DateMode } from '../../context/DateRangeContext'
import { format, parseISO } from 'date-fns'
import { Calendar } from 'lucide-react'

const MODES: { key: DateMode; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'custom', label: 'Custom' },
]

const DAYS_OPTIONS: Partial<Record<DateMode, number[]>> = {
  monthly: [28, 29, 30, 31],
  yearly: [365, 366],
}

const inputClass =
  'border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400'

export default function DateRangeBar() {
  const { mode, startDate, days, endDate, fromDate, toDate, setMode, setStartDate, setDays, setEndDate } =
    useDateRange()

  const rangeLabel =
    fromDate && toDate
      ? `${format(parseISO(fromDate), 'MMM d, yyyy')} – ${format(parseISO(toDate), 'MMM d, yyyy')}`
      : null

  const daysOptions = DAYS_OPTIONS[mode]

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Mode pills */}
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === key
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date controls — hidden for overall */}
        {mode !== 'overall' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {mode === 'custom' ? (
              <>
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </>
            ) : mode === 'weekly' ? (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                7 days
              </span>
            ) : daysOptions ? (
              <div className="flex items-center gap-1">
                {daysOptions.map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      days === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Computed range label */}
        {rangeLabel && (
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
            {rangeLabel}
          </span>
        )}
      </div>
    </div>
  )
}
