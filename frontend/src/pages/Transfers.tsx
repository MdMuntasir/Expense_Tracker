import { useState, useEffect, useCallback } from 'react'
import { api, Transfer } from '../api/client'
import { format, parseISO } from 'date-fns'
import { Trash2, Pencil, ArrowRight, Plus } from 'lucide-react'
import TransferModal from '../components/modals/TransferModal'

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Transfer | null>(null)

  const fetchTransfers = useCallback(() => {
    setLoading(true)
    api.getTransfers()
      .then(setTransfers)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTransfers() }, [fetchTransfers])

  async function handleDelete(id: number) {
    if (!confirm('Delete this transfer? Source balances will be restored.')) return
    await api.deleteTransfer(id)
    fetchTransfers()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Transfers</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Transfer
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
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
                      <button
                        onClick={() => setEditing(tr)}
                        className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(tr.id)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                      >
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

      {showCreate && (
        <TransferModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchTransfers() }}
        />
      )}

      {editing && (
        <TransferModal
          transfer={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); fetchTransfers() }}
        />
      )}
    </div>
  )
}
