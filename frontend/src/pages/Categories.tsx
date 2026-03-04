import { useState, useEffect } from 'react'
import { api, Category } from '../api/client'
import { Trash2 } from 'lucide-react'
import AddCategoryModal from '../components/modals/AddCategoryModal'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  function fetchCategories() {
    api.getCategories().then(setCategories).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCategories() }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return
    try {
      await api.deleteCategory(id)
      fetchCategories()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-12 text-center text-gray-400 text-sm">
          No categories yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-gray-200 dark:text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCategoryModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchCategories() }} />
      )}
    </div>
  )
}
