import { Plus, Minus, LogOut } from 'lucide-react'
import { useAuth } from '../../App'
import { api } from '../../api/client'

interface HeaderProps {
  onAddIncome: () => void
  onAddExpense: () => void
}

export default function Header({ onAddIncome, onAddExpense }: HeaderProps) {
  const { user, setUser } = useAuth()

  async function handleLogout() {
    await api.logout()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900">Expense Tracker</h1>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onAddIncome}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Income</span>
        </button>
        <button
          onClick={onAddExpense}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Minus size={16} />
          <span className="hidden sm:inline">Expense</span>
        </button>

        <div className="flex items-center gap-2 ml-2">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
