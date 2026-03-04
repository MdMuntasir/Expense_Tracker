import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { api, Transaction, Source, Category } from '../../api/client'

interface EditTransactionModalProps {
  transaction: Transaction
  onClose: () => void
  onSuccess: () => void
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6B7280',
]

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

export default function EditTransactionModal({ transaction, onClose, onSuccess }: EditTransactionModalProps) {
  const isExpense = transaction.type === 'expense'

  const [sources, setSources] = useState<Source[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState(transaction.title)
  const [description, setDescription] = useState(transaction.description ?? '')
  const [amount, setAmount] = useState(String(transaction.amount))
  const [date, setDate] = useState(transaction.date)
  const [categoryId, setCategoryId] = useState<number | ''>(transaction.category_id ?? '')
  const [sourceId, setSourceId] = useState<number | ''>(transaction.source_id)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Inline category creation
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6B7280')
  const [catSaving, setCatSaving] = useState(false)

  useEffect(() => {
    const fetches = isExpense
      ? Promise.all([api.getSources(), api.getCategories()])
      : Promise.all([api.getSources(), Promise.resolve([] as Category[])])

    fetches.then(([s, cats]) => {
      setSources(s)
      setCategories(cats)
    })
  }, [isExpense])

  async function handleCreateCategory() {
    if (!newCatName) return
    setCatSaving(true)
    try {
      const cat = await api.createCategory({ name: newCatName, color: newCatColor })
      setCategories(prev => [...prev, cat])
      setCategoryId(cat.id)
      setShowNewCat(false)
      setNewCatName('')
      setNewCatColor('#6B7280')
    } finally {
      setCatSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !amount || !date || !sourceId) return
    setSaving(true)
    setError('')
    try {
      await api.updateTransaction(transaction.id, {
        title,
        description: description || undefined,
        amount: parseFloat(amount),
        date,
        category_id: categoryId ? (categoryId as number) : undefined,
        source_id: sourceId as number,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const accentRing = isExpense ? 'focus:ring-red-400' : 'focus:ring-green-500'
  const submitBg = isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit {isExpense ? 'Expense' : 'Income'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              className={inputClass.replace('focus:ring-indigo-500', accentRing)}
              value={title} onChange={e => setTitle(e.target.value)} required
            />
          </div>

          {isExpense && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                className={inputClass.replace('focus:ring-indigo-500', accentRing)}
                value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
              <input
                type="number" min="0.01" step="0.01"
                className={inputClass.replace('focus:ring-indigo-500', accentRing)}
                value={amount} onChange={e => setAmount(e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
              <input
                type="date"
                className={inputClass.replace('focus:ring-indigo-500', accentRing)}
                value={date} onChange={e => setDate(e.target.value)} required
              />
            </div>
          </div>

          {isExpense && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <button
                  type="button"
                  onClick={() => setShowNewCat(v => !v)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={12} /> New
                </button>
              </div>

              {showNewCat && (
                <div className="mb-2 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-800">
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button
                        type="button" key={c}
                        onClick={() => setNewCatColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${newCatColor === c ? 'border-gray-900 dark:border-gray-100' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    type="button" onClick={handleCreateCategory} disabled={catSaving || !newCatName}
                    className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {catSaving ? 'Creating…' : 'Create Category'}
                  </button>
                </div>
              )}

              <select
                className={inputClass.replace('focus:ring-indigo-500', accentRing)}
                value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}
              >
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
            <select
              className={inputClass.replace('focus:ring-indigo-500', accentRing)}
              value={sourceId} onChange={e => setSourceId(Number(e.target.value))}
            >
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${submitBg}`}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
