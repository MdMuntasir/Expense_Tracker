import { useState } from 'react'
import { X } from 'lucide-react'
import { api, Saving } from '../../api/client'
import { format } from 'date-fns'

interface Props {
  saving?: Saving
  onClose: () => void
  onSuccess: () => void
}

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

export default function AddSavingModal({ saving, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(saving?.title ?? '')
  const [amount, setAmount] = useState(saving?.amount.toString() ?? '')
  const [targetDate, setTargetDate] = useState(saving?.target_date ?? format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState(saving?.notes ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !amount || !targetDate) return
    setSubmitting(true)
    setError('')
    try {
      const data = { title, amount: parseFloat(amount), target_date: targetDate, notes: notes || undefined }
      if (saving) {
        await api.updateSaving(saving.id, data)
      } else {
        await api.createSaving(data)
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {saving ? 'Edit Saving Goal' : 'Add Saving Goal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              className={inputClass}
              placeholder="e.g. Emergency Fund, Trip to Cox's Bazar"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
              <input
                type="number" min="0.01" step="0.01"
                className={inputClass}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date *</label>
              <input
                type="date"
                className={inputClass}
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input
              className={inputClass}
              placeholder="Optional"
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
              type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving…' : saving ? 'Update' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
