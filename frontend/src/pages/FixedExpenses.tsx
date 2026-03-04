import { useState, useEffect } from 'react'
import { api, FixedExpense } from '../api/client'
import { Plus, Pencil, Trash2, CheckCircle, CalendarClock, ChevronDown } from 'lucide-react'
import AddFixedExpenseModal from '../components/modals/AddFixedExpenseModal'
import PayFixedExpenseModal from '../components/modals/PayFixedExpenseModal'
import { format, parseISO } from 'date-fns'

const FREQ_LABELS: Record<string, string> = {
  'one-time': 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const FREQ_COLORS: Record<string, string> = {
  'one-time': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  daily: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  weekly: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  monthly: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  yearly: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
}

export default function FixedExpenses() {
  const [items, setItems] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<FixedExpense | null>(null)
  const [payItem, setPayItem] = useState<FixedExpense | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await api.getFixedExpenses(showInactive)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showInactive])

  async function handleDelete(id: number) {
    if (!confirm('Delete this fixed expense?')) return
    await api.deleteFixedExpense(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const totalReserved = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fixed Expenses</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Fixed Expense
        </button>
      </div>

      {/* Summary strip */}
      {!showInactive && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
            <CalendarClock size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Total Reserved</p>
            <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              ৳{totalReserved.toLocaleString()}
              <span className="text-sm font-normal ml-2 text-amber-600 dark:text-amber-500">
                across {items.length} expense{items.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Toggle inactive */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowInactive(v => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ChevronDown size={14} className={showInactive ? 'rotate-180 transition-transform' : 'transition-transform'} />
          {showInactive ? 'Showing paid / inactive' : 'Show paid / inactive'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <CalendarClock size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {showInactive ? 'No paid expenses yet' : 'No fixed expenses yet'}
          </p>
          {!showInactive && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              Add your first fixed expense
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.category_color ?? '#6B7280' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLORS[item.frequency] ?? FREQ_COLORS['one-time']}`}>
                    {FREQ_LABELS[item.frequency] ?? item.frequency}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {item.category_name ?? 'No category'}
                  {item.source_name && ` · ${item.source_name}`}
                  {item.next_due_date && ` · Due ${format(parseISO(item.next_due_date), 'MMM d, yyyy')}`}
                  {item.notes && ` · ${item.notes}`}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">
                ৳{item.amount.toLocaleString()}
              </p>
              {!showInactive && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setPayItem(item)}
                    title="Mark as Paid"
                    className="p-1.5 text-green-500 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => setEditItem(item)}
                    title="Edit"
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddFixedExpenseModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
        />
      )}

      {editItem && (
        <AddFixedExpenseModal
          fixedExpense={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => { setEditItem(null); load() }}
        />
      )}

      {payItem && (
        <PayFixedExpenseModal
          fixedExpense={payItem}
          onClose={() => setPayItem(null)}
          onSuccess={() => { setPayItem(null); load() }}
        />
      )}
    </div>
  )
}
