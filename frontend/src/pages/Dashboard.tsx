import { useState, useEffect } from 'react'
import { api, DashboardData, FixedExpense } from '../api/client'
import { useDateRange } from '../context/DateRangeContext'
import MonthlyBarChart from '../components/charts/MonthlyBarChart'
import CategoryBarChart from '../components/charts/CategoryBarChart'
import { format, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, CalendarClock, CheckCircle, ArrowRight, Gauge, Coffee } from 'lucide-react'
import { Link } from 'react-router-dom'
import PayFixedExpenseModal from '../components/modals/PayFixedExpenseModal'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payItem, setPayItem] = useState<FixedExpense | null>(null)
  const { mode, fromDate, toDate } = useDateRange()

  function load() {
    setLoading(true)
    api.getDashboard(fromDate, toDate)
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [fromDate, toDate]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>
  if (!data) return <div className="text-red-500 text-sm">Failed to load dashboard</div>

  const isFiltered = mode !== 'overall'
  const periodIncome = data.monthlyData.reduce((sum, m) => sum + m.income, 0)
  const periodExpense = data.monthlyData.reduce((sum, m) => sum + m.expense, 0)
  const incomeLabel = isFiltered ? 'Period Income' : 'This Month Income'
  const expenseLabel = isFiltered ? 'Period Expense' : 'This Month Expense'
  const chartTitle = isFiltered ? 'Income vs Expense (Period)' : 'Income vs Expense (Last 6 Months)'

  // Daily budget calculations
  const dailyBudget = Math.max(0, data.availableBalance / data.remainingDaysInMonth)
  const todayRemaining = Math.max(0, dailyBudget - data.todayExpenses)
  const todayOverspent = data.todayExpenses > dailyBudget

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
          {(data.fixedExpensesCount > 0 || data.currentSavingsTarget > 0) && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">৳{(data.fixedExpensesTotal + data.currentSavingsTarget).toLocaleString()} reserved</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><TrendingUp size={18} className="text-green-600" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{incomeLabel}</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ৳{periodIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><TrendingDown size={18} className="text-red-500" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{expenseLabel}</span>
          </div>
          <p className="text-2xl font-bold text-red-500">
            ৳{periodExpense.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Daily Budget cards — only for monthly/custom modes */}
      {(mode === 'monthly' || mode === 'custom') && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Allowance */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Gauge size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Allowance</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{data.remainingDaysInMonth} day{data.remainingDaysInMonth !== 1 ? 's' : ''} left this month</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ৳{Math.floor(dailyBudget).toLocaleString()}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">/day</span>
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>Total balance</span>
              <span>৳{data.totalBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>Fixed expenses</span>
              <span className="text-amber-500">-৳{data.fixedExpensesTotal.toLocaleString()}</span>
            </div>
            {data.currentSavingsTarget > 0 && (
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Savings target</span>
                <span className="text-teal-500">-৳{data.currentSavingsTarget.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span>Spendable</span>
              <span>৳{Math.max(0, data.availableBalance).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Today Remaining */}
        <div className={`bg-white dark:bg-gray-900 rounded-xl border p-5 ${
          todayOverspent
            ? 'border-red-200 dark:border-red-800'
            : 'border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${todayOverspent ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
              <Coffee size={18} className={todayOverspent ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's Remaining</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {todayOverspent
                  ? `Overspent by ৳${(data.todayExpenses - dailyBudget).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : `Spent ৳${data.todayExpenses.toLocaleString()} today`}
              </p>
            </div>
          </div>
          <p className={`text-3xl font-bold ${todayOverspent ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            ৳{Math.floor(todayRemaining).toLocaleString()}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">left today</span>
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {dailyBudget > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1.5">
                  <span>৳{data.todayExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} of ৳{Math.floor(dailyBudget).toLocaleString()} spent</span>
                  <span>{Math.min(100, Math.round((data.todayExpenses / dailyBudget) * 100))}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${todayOverspent ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, (data.todayExpenses / dailyBudget) * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{chartTitle}</h3>
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
