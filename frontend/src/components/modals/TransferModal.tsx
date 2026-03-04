import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { api, Source, Transfer } from '../../api/client'
import { format } from 'date-fns'

interface TransferModalProps {
  onClose: () => void
  onSuccess: () => void
  transfer?: Transfer  // if provided, modal is in edit mode
}

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

export default function TransferModal({ onClose, onSuccess, transfer }: TransferModalProps) {
  const isEdit = !!transfer
  const [sources, setSources] = useState<Source[]>([])
  const [fromId, setFromId] = useState<number | ''>(transfer?.from_source_id ?? '')
  const [toId, setToId] = useState<number | ''>(transfer?.to_source_id ?? '')
  const [amount, setAmount] = useState(transfer ? String(transfer.amount) : '')
  const [fee, setFee] = useState(transfer ? String(transfer.fee) : '0')
  const [date, setDate] = useState(transfer?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [note, setNote] = useState(transfer?.note ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getSources().then(s => {
      setSources(s)
      if (!isEdit) {
        if (s.length >= 1) setFromId(s[0].id)
        if (s.length >= 2) setToId(s[1].id)
      }
    })
  }, [isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId || !amount) return
    if (fromId === toId) { setError('Source and destination must be different'); return }
    setSaving(true)
    setError('')
    try {
      const data = {
        from_source_id: fromId as number,
        to_source_id: toId as number,
        amount: parseFloat(amount),
        fee: parseFloat(fee) || 0,
        date,
        note: note || undefined,
      }
      if (isEdit) {
        await api.updateTransfer(transfer.id, data)
      } else {
        await api.createTransfer(data)
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Transfer' : 'Transfer Money'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From *</label>
              <select
                className={inputClass}
                value={fromId} onChange={e => setFromId(Number(e.target.value))} required
              >
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To *</label>
              <select
                className={inputClass}
                value={toId} onChange={e => setToId(Number(e.target.value))} required
              >
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
              <input
                type="number" min="0.01" step="0.01"
                className={inputClass}
                value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transfer Fee</label>
              <input
                type="number" min="0" step="0.01"
                className={inputClass}
                value={fee} onChange={e => setFee(e.target.value)} placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
            <input
              type="date"
              className={inputClass}
              value={date} onChange={e => setDate(e.target.value)} required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
            <input
              className={inputClass}
              value={note} onChange={e => setNote(e.target.value)} placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? (isEdit ? 'Saving…' : 'Transferring…') : (isEdit ? 'Save Changes' : 'Transfer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
