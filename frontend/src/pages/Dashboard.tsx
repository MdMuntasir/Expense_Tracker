import { useState, useEffect } from 'react'
import { api, DashboardData } from '../api/client'
import MonthlyBarChart from '../components/charts/MonthlyBarChart'
import CategoryBarChart from '../components/charts/CategoryBarChart'
import { format, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>
  if (!data) return <div className="text-red-500 text-sm">Failed to load dashboard</div>

  const currentMonth = data.monthlyData[data.monthlyData.length - 1]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-50 rounded-lg"><Wallet size={18} className="text-indigo-600" /></div>
            <span className="text-sm text-gray-500">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">৳{data.totalBalance.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={18} className="text-green-600" /></div>
            <span className="text-sm text-gray-500">This Month Income</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ৳{(currentMonth?.income ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-50 rounded-lg"><TrendingDown size={18} className="text-red-500" /></div>
            <span className="text-sm text-gray-500">This Month Expense</span>
          </div>
          <p className="text-2xl font-bold text-red-500">
            ৳{(currentMonth?.expense ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expense (Last 6 Months)</h3>
          {data.monthlyData.length > 0 ? (
            <MonthlyBarChart data={data.monthlyData} />
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category (This Month)</h3>
          <CategoryBarChart data={data.categoryData} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Transactions</h3>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {data.recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tx.category_color ?? '#6B7280' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.title}</p>
                    <p className="text-xs text-gray-400">
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
    </div>
  )
}
