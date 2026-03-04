import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import AddIncomeModal from '../modals/AddIncomeModal'
import AddExpenseModal from '../modals/AddExpenseModal'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [showIncome, setShowIncome] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onAddIncome={() => setShowIncome(true)}
          onAddExpense={() => setShowExpense(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6" key={refreshKey}>
          {children}
        </main>
      </div>

      {showIncome && (
        <AddIncomeModal
          onClose={() => setShowIncome(false)}
          onSuccess={() => { setShowIncome(false); refresh() }}
        />
      )}
      {showExpense && (
        <AddExpenseModal
          onClose={() => setShowExpense(false)}
          onSuccess={() => { setShowExpense(false); refresh() }}
        />
      )}
    </div>
  )
}
