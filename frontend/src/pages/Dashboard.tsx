import { useState, useEffect } from 'react'
import { api, DashboardData, FixedExpense } from '../api/client'
import MonthlyBarChart from '../components/charts/MonthlyBarChart'
import CategoryBarChart from '../components/charts/CategoryBarChart'
import { format, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, CalendarClock, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PayFixedExpenseModal from '../components/modals/PayFixedExpenseModal'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payItem, setPayItem] = useState<FixedExpense | null>(null)

  function load() {
    api.getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>
  if (!data) return <div className="text-red-500 text-sm">Failed to load dashboard</div>

  const currentMonth = data.monthlyData[data.monthlyData.length - 1]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h2>

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><Wallet size={18} className="text-indigo-600 dark:text-indigo-400" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">৳{data.totalBalance.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg"><ShieldCheck size={18} className="text-amber-600 dark:text-amber-400" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Available</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">৳{data.availableBalance.toLocaleString()}</p>
          {data.fixedExpensesCount > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">৳{data.fixedExpensesTotal.toLocaleString()} reserved</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><TrendingUp size={18} className="text-green-600" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">This Month Income</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ৳{(currentMonth?.income ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><TrendingDown size={18} className="text-red-500" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">This Month Expense</span>
          </div>
          <p className="text-2xl font-bold text-red-500">
            ৳{(currentMonth?.expense ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Income vs Expense (Last 6 Months)</h3>
          {data.monthlyData.length > 0 ? (
            <MonthlyBarChart data={data.monthlyData} />
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h3>
          <CategoryBarChart data={data.categoryData} />
        </div>
      </div>

      {/* Fixed Expenses widget */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fixed Expenses</h3>
            {data.fixedExpensesCount > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                ৳{data.fixedExpensesTotal.toLocaleString()} reserved
              </span>
            )}
          </div>
          <Link
            to="/fixed-expenses"
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
          >
            Manage <ArrowRight size={12} />
          </Link>
        </div>

        {data.fixedExpenses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 dark:text-gray-500">No active fixed expenses</p>
            <Link to="/fixed-expenses" className="text-xs text-amber-600 dark:text-amber-400 hover:underline mt-1 inline-block">
              Add a fixed expense →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.fixedExpenses.slice(0, 5).map(fe => (
              <div key={fe.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fe.category_color ?? '#6B7280' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fe.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {fe.frequency}
                    {fe.next_due_date && ` · Due ${format(parseISO(fe.next_due_date), 'MMM d')}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex-shrink-0">
                  ৳{fe.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => setPayItem(fe)}
                  title="Mark as Paid"
                  className="p-1.5 text-green-500 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <CheckCircle size={16} />
                </button>
              </div>
            ))}
            {data.fixedExpenses.length > 5 && (
              <Link to="/fixed-expenses" className="block text-center text-xs text-amber-600 dark:text-amber-400 hover:underline pt-2">
                View all {data.fixedExpenses.length} fixed expenses
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Transactions</h3>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {data.recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tx.category_color ?? '#6B7280' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tx.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {format(parseISO(tx.date), 'MMM d, yyyy')} · {tx.source_name}
                      {tx.category_name && ` · ${tx.category_name}`}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {payItem && (
        <PayFixedExpenseModal
          fixedExpense={payItem}
          onClose={() => setPayItem(null)}
          onSuccess={() => { setPayItem(null); setLoading(true); load() }}
        />
      )}
    </div>
  )
}
