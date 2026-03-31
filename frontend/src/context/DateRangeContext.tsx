import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { addDays, format, startOfMonth, startOfYear, startOfWeek, getDaysInMonth, parseISO } from 'date-fns'

export type DateMode = 'overall' | 'yearly' | 'monthly' | 'weekly' | 'custom'

interface DateRangeState {
  mode: DateMode
  startDate: string  // YYYY-MM-DD
  days: number       // for yearly / monthly / weekly
  endDate: string    // YYYY-MM-DD, for custom only
}

interface DateRangeContextValue extends DateRangeState {
  fromDate: string | null
  toDate: string | null
  setMode: (mode: DateMode) => void
  setStartDate: (date: string) => void
  setDays: (days: number) => void
  setEndDate: (date: string) => void
}

const STORAGE_KEY = 'exp_date_range'

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function defaultState(): DateRangeState {
  const now = new Date()
  return {
    mode: 'overall',
    startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
    days: getDaysInMonth(now),
    endDate: todayStr(),
  }
}

function computeRange(state: DateRangeState): { fromDate: string | null; toDate: string | null } {
  if (state.mode === 'overall') return { fromDate: null, toDate: null }
  if (state.mode === 'custom') return { fromDate: state.startDate, toDate: state.endDate }
  const end = format(addDays(parseISO(state.startDate), state.days - 1), 'yyyy-MM-dd')
  return { fromDate: state.startDate, toDate: end }
}

const DateRangeContext = createContext<DateRangeContextValue>({
  ...defaultState(),
  fromDate: null,
  toDate: null,
  setMode: () => {},
  setStartDate: () => {},
  setDays: () => {},
  setEndDate: () => {},
})

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DateRangeState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...defaultState(), ...JSON.parse(saved) }
    } catch {}
    return defaultState()
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const { fromDate, toDate } = computeRange(state)

  function setMode(mode: DateMode) {
    const now = new Date()
    setState(() => {
      if (mode === 'overall') {
        return { mode, startDate: format(startOfMonth(now), 'yyyy-MM-dd'), days: getDaysInMonth(now), endDate: todayStr() }
      }
      if (mode === 'yearly') {
        return { mode, startDate: format(startOfYear(now), 'yyyy-MM-dd'), days: 365, endDate: todayStr() }
      }
      if (mode === 'monthly') {
        return { mode, startDate: format(startOfMonth(now), 'yyyy-MM-dd'), days: getDaysInMonth(now), endDate: todayStr() }
      }
      if (mode === 'weekly') {
        return { mode, startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), days: 7, endDate: todayStr() }
      }
      // custom
      return { mode, startDate: format(startOfMonth(now), 'yyyy-MM-dd'), days: getDaysInMonth(now), endDate: todayStr() }
    })
  }

  return (
    <DateRangeContext.Provider value={{
      ...state,
      fromDate,
      toDate,
      setMode,
      setStartDate: (startDate) => setState(prev => ({ ...prev, startDate })),
      setDays: (days) => setState(prev => ({ ...prev, days })),
      setEndDate: (endDate) => setState(prev => ({ ...prev, endDate })),
    }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export const useDateRange = () => useContext(DateRangeContext)
