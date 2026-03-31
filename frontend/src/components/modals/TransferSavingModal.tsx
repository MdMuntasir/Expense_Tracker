import { useState, useEffect } from 'react'
import { X, ArrowDownToLine } from 'lucide-react'
import { api, Saving, Source } from '../../api/client'
import { format } from 'date-fns'

interface Props {
  saving: Saving
  onClose: () => void
  onSuccess: () => void
}

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

export default function TransferSavingModal({ saving, onClose, onSuccess }: Props) {
  const [sources, setSources] = useState<Source[]>([])
  const [sourceId, setSourceId] = useState<number | ''>('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [error, setError] = useState('')
  const [saving_, setSaving_] = useState(false)

  useEffect(() => {
    api.getSources().then(s => {
      setSources(s)
      const def = s.find(x => x.is_default) ?? s[0]
      if (def) setSourceId(def.id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceId || !date) return
    setSaving_(true)
    setError('')
    try {
      await api.transferSaving(saving.id, { source_id: sourceId as number, date })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to transfer')
    } finally {
      setSaving_(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transfer to Source</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Deposit ৳{saving.amount.toLocaleString()} from "{saving.label}"
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination Source *</label>
            <select
              className={inputClass}
              value={sourceId}
              onChange={e => setSourceId(Number(e.target.value))}
              required
            >
              <option value="">Select source…</option>
              {sources.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — ৳{s.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving_}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <ArrowDownToLine size={15} />
              {saving_ ? 'Transferring…' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
