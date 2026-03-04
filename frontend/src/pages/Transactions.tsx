import { useState, useEffect, useCallback } from 'react'
import { api, Transaction, Transfer, Category, Source } from '../api/client'
import { format, parseISO } from 'date-fns'
import { Trash2, Pencil, Filter, Plus, ArrowRight } from 'lucide-react'
import EditTransactionModal from '../components/modals/EditTransactionModal'
import TransferModal from '../components/modals/TransferModal'

type Tab = 'transactions' | 'transfers'

export default function Transactions() {
  const [tab, setTab] = useState<Tab>('transactions')

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [editing, setEditing] = useState<Transaction | null>(null)

  // Filters
  const [type, setType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Transfers state
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [trLoading, setTrLoading] = useState(true)
  const [showCreateTransfer, setShowCreateTransfer] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)

  const fetchTransactions = useCallback(() => {
    setTxLoading(true)
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) }
    if (type) params.type = type
    if (categoryId) params.category_id = categoryId
    if (sourceId) params.source_id = sourceId
    if (from) params.from = from
    if (to) params.to = to
    api.getTransactions(params)
      .then(setTransactions)
      .finally(() => setTxLoading(false))
  }, [type, categoryId, sourceId, from, to, offset])

  const fetchTransfers = useCallback(() => {
    setTrLoading(true)
    api.getTransfers()
      .then(setTransfers)
      .finally(() => setTrLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([api.getCategories(), api.getSources()]).then(([cats, srcs]) => {
      setCategories(cats)
      setSources(srcs)
    })
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])
  useEffect(() => { fetchTransfers() }, [fetchTransfers])

  async function handleDeleteTransaction(id: number) {
    if (!confirm('Delete this transaction?')) return
    await api.deleteTransaction(id)
    fetchTransactions()
  }

  async function handleDeleteTransfer(id: number) {
    if (!confirm('Delete this transfer? Source balances will be restored.')) return
    await api.deleteTransfer(id)
    fetchTransfers()
  }

  function resetFilters() {
    setType(''); setCategoryId(''); setSourceId(''); setFrom(''); setTo(''); setOffset(0)
  }

  const selectClass = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Records</h2>
        {tab === 'transfers' && (
          <button
            onClick={() => setShowCreateTransfer(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Transfer
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['transactions', 'transfers'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Filter size={15} /> Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select className={selectClass} value={type} onChange={e => { setType(e.target.value); setOffset(0) }}>
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select className={selectClass} value={categoryId} onChange={e => { setCategoryId(e.target.value); setOffset(0) }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={selectClass} value={sourceId} onChange={e => { setSourceId(e.target.value); setOffset(0) }}>
                <option value="">All Sources</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" className={selectClass} value={from} onChange={e => { setFrom(e.target.value); setOffset(0) }} />
              <input type="date" className={selectClass} value={to} onChange={e => { setTo(e.target.value); setOffset(0) }} />
            </div>
            {(type || categoryId || sourceId || from || to) && (
              <button onClick={resetFilters} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear filters
              </button>
            )}
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {txLoading ? (
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
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{format(parseISO(tx.date), 'MMM d, yy')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tx.category_color && (
                            <span
                              className="sm:hidden flex-shrink-0 w-2 h-2 rounded-full"
                              style={{ backgroundColor: tx.category_color }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{tx.title}</p>
                            {tx.description && <p className="text-xs text-gray-400 dark:text-gray-500">{tx.description}</p>}
                          </div>
                        </div>
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
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditing(tx)} className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
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
        </>
      )}

      {tab === 'transfers' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {trLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
          ) : transfers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No transfers yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Route</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Fee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Note</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {format(parseISO(tr.date), 'MMM d, yy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium">
                        <span>{tr.from_source_name}</span>
                        <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                        <span>{tr.to_source_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      ৳{tr.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell whitespace-nowrap">
                      {tr.fee > 0 ? `৳${tr.fee.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {tr.note ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingTransfer(tr)} className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteTransfer(tr.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editing && (
        <EditTransactionModal
          transaction={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); fetchTransactions() }}
        />
      )}

      {showCreateTransfer && (
        <TransferModal
          onClose={() => setShowCreateTransfer(false)}
          onSuccess={() => { setShowCreateTransfer(false); fetchTransfers() }}
        />
      )}

      {editingTransfer && (
        <TransferModal
          transfer={editingTransfer}
          onClose={() => setEditingTransfer(null)}
          onSuccess={() => { setEditingTransfer(null); fetchTransfers() }}
        />
      )}
    </div>
  )
}
