import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../api/client'

interface AddSourceModalProps {
  onClose: () => void
  onSuccess: () => void
}

type SourceType = 'cash' | 'bank' | 'card' | 'mobile'

export default function AddSourceModal({ onClose, onSuccess }: AddSourceModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<SourceType>('cash')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [cardLast4, setCardLast4] = useState('')
  const [systemName, setSystemName] = useState('')
  const [balance, setBalance] = useState('0')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let details: Record<string, string> | undefined
    if (type === 'bank') details = { bank_name: bankName, account_number: accountNumber }
    else if (type === 'card') details = { bank_name: bankName, card_last4: cardLast4 }
    else if (type === 'mobile') details = { system_name: systemName }

    try {
      await api.createSource({
        name,
        type,
        details,
        balance: parseFloat(balance) || 0,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const typeOptions: { value: SourceType; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank' },
    { value: 'card', label: 'Card' },
    { value: 'mobile', label: 'Mobile Banking' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Add Source</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. My Bank Account"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors ${
                    type === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" className="sr-only" value={opt.value} checked={type === opt.value} onChange={() => setType(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {type === 'bank' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={bankName} onChange={e => setBankName(e.target.value)} required placeholder="e.g. BRAC Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required placeholder="e.g. 1234567890"
                />
              </div>
            </>
          )}

          {type === 'card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={bankName} onChange={e => setBankName(e.target.value)} required placeholder="e.g. Dhaka Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 Digits</label>
                <input
                  maxLength={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={cardLast4} onChange={e => setCardLast4(e.target.value)} placeholder="1234"
                />
              </div>
            </>
          )}

          {type === 'mobile' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={systemName} onChange={e => setSystemName(e.target.value)} required placeholder="e.g. bKash, Nagad"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
            <input
              type="number" min="0" step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
