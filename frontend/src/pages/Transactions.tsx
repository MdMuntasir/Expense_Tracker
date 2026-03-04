import { useState, useEffect, useCallback } from 'react'
import { api, Transaction, Category, Source } from '../api/client'
import { format, parseISO } from 'date-fns'
import { Trash2, Filter } from 'lucide-react'

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [type, setType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchTransactions = useCallback(() => {
    setLoading(true)
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) }
    if (type) params.type = type
    if (categoryId) params.category_id = categoryId
    if (sourceId) params.source_id = sourceId
    if (from) params.from = from
    if (to) params.to = to

    api.getTransactions(params)
      .then(setTransactions)
      .finally(() => setLoading(false))
  }, [type, categoryId, sourceId, from, to, offset])

  useEffect(() => {
    Promise.all([api.getCategories(), api.getSources()]).then(([cats, srcs]) => {
      setCategories(cats)
      setSources(srcs)
    })
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function handleDelete(id: number) {
    if (!confirm('Delete this transaction?')) return
    await api.deleteTransaction(id)
    fetchTransactions()
  }

  function resetFilters() {
    setType(''); setCategoryId(''); setSourceId(''); setFrom(''); setTo(''); setOffset(0)
  }

  const selectClass = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Transactions</h2>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Filter size={15} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            className={selectClass}
            value={type} onChange={e => { setType(e.target.value); setOffset(0) }}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            className={selectClass}
            value={categoryId} onChange={e => { setCategoryId(e.target.value); setOffset(0) }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className={selectClass}
            value={sourceId} onChange={e => { setSourceId(e.target.value); setOffset(0) }}
          >
            <option value="">All Sources</option>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <input
            type="date"
            className={selectClass}
            value={from} onChange={e => { setFrom(e.target.value); setOffset(0) }}
            placeholder="From"
          />
          <input
            type="date"
            className={selectClass}
            value={to} onChange={e => { setTo(e.target.value); setOffset(0) }}
            placeholder="To"
          />
        </div>
        {(type || categoryId || sourceId || from || to) && (
          <button onClick={resetFilters} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No transactions found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Source</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{format(parseISO(tx.date), 'MMM d, yy')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{tx.title}</p>
                    {tx.description && <p className="text-xs text-gray-400 dark:text-gray-500">{tx.description}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {tx.category_name ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tx.category_color ?? '#6B7280' }}
                      >
                        {tx.category_name}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{tx.source_name}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(tx.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(o => Math.max(0, o - limit))}
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Previous
        </button>
        <span>Showing {offset + 1}–{offset + transactions.length}</span>
        <button
          disabled={transactions.length < limit}
          onClick={() => setOffset(o => o + limit)}
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  )
}
