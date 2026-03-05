import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Wallet, CalendarClock } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', mobileLabel: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Records', mobileLabel: 'Records', icon: ArrowLeftRight, end: false },
  { to: '/sources', label: 'Sources', mobileLabel: 'Sources', icon: Wallet, end: false },
  { to: '/fixed-expenses', label: 'Fixed Expenses', mobileLabel: 'Fixed', icon: CalendarClock, end: false },
]

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ET</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex">
        {links.map(({ to, label: _label, mobileLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {mobileLabel}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
