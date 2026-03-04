import { useState, useEffect } from 'react'
import { api, Source } from '../api/client'
import { Trash2, Edit2, ArrowLeftRight, Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react'
import AddSourceModal from '../components/modals/AddSourceModal'
import TransferModal from '../components/modals/TransferModal'

function sourceIcon(type: Source['type']) {
  switch (type) {
    case 'bank': return <Banknote size={18} className="text-blue-500" />
    case 'card': return <CreditCard size={18} className="text-purple-500" />
    case 'mobile': return <Smartphone size={18} className="text-green-500" />
    default: return <Wallet size={18} className="text-orange-500" />
  }
}

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  function fetchSources() {
    api.getSources().then(setSources).finally(() => setLoading(false))
  }

  useEffect(() => { fetchSources() }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this source? This cannot be undone.')) return
    try {
      await api.deleteSource(id)
      fetchSources()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function handleEditSave(id: number) {
    await api.updateSource(id, { name: editName })
    setEditingId(null)
    fetchSources()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Sources</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeftRight size={15} />
            <span className="hidden sm:inline">Transfer</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          >
            + <span className="hidden sm:inline">Add </span>Source
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map(source => (
            <div key={source.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {sourceIcon(source.type)}
                  <div>
                    {editingId === source.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          className="border border-gray-300 rounded px-2 py-0.5 text-sm w-28"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditSave(source.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleEditSave(source.id)} className="text-xs text-indigo-600">Save</button>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-900">{source.name}</p>
                    )}
                    <p className="text-xs text-gray-400 capitalize">{source.type}{source.is_default ? ' · Default' : ''}</p>
                  </div>
                </div>

                {!source.is_default && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(source.id); setEditName(source.name) }}
                      className="p-1.5 text-gray-300 hover:text-gray-600 rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(source.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {source.details && (() => {
                try {
                  const d = JSON.parse(source.details)
                  return (
                    <div className="text-xs text-gray-400 mb-3 space-y-0.5">
                      {d.bank_name && <p>Bank: {d.bank_name}</p>}
                      {d.account_number && <p>Account: {d.account_number}</p>}
                      {d.card_last4 && <p>Card: ···· {d.card_last4}</p>}
                      {d.system_name && <p>Service: {d.system_name}</p>}
                    </div>
                  )
                } catch { return null }
              })()}

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">Balance</p>
                <p className={`text-xl font-bold ${source.balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  ৳{source.balance.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddSourceModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchSources() }} />
      )}
      {showTransfer && (
        <TransferModal onClose={() => setShowTransfer(false)} onSuccess={() => { setShowTransfer(false); fetchSources() }} />
      )}
    </div>
  )
}
