const BASE = ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string }
    throw new Error(err.error ?? res.statusText)
  }

  return res.json() as Promise<T>
}

export const api = {
  // Auth
  getMe: () => request<{ user: User | null }>('/api/auth/me'),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Sources
  getSources: () => request<Source[]>('/api/sources'),
  createSource: (data: CreateSourceData) =>
    request<Source>('/api/sources', { method: 'POST', body: JSON.stringify(data) }),
  updateSource: (id: number, data: Partial<CreateSourceData>) =>
    request<Source>(`/api/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSource: (id: number) =>
    request<{ ok: boolean }>(`/api/sources/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (data: { name: string; color?: string }) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id: number) =>
    request<{ ok: boolean }>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params?: TransactionQuery) =>
    request<Transaction[]>('/api/transactions?' + new URLSearchParams(params as Record<string, string>).toString()),
  createTransaction: (data: CreateTransactionData) =>
    request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id: number) =>
    request<{ ok: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }),

  // Transfers
  getTransfers: () => request<Transfer[]>('/api/transfers'),
  createTransfer: (data: CreateTransferData) =>
    request<Transfer>('/api/transfers', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/api/dashboard'),
}

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

export interface Source {
  id: number
  user_id: string
  name: string
  type: 'cash' | 'bank' | 'card' | 'mobile'
  details: string | null
  balance: number
  is_default: number
  created_at: string
}

export interface Category {
  id: number
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Transaction {
  id: number
  user_id: string
  type: 'income' | 'expense'
  title: string
  description: string | null
  amount: number
  date: string
  category_id: number | null
  source_id: number
  category_name: string | null
  category_color: string | null
  source_name: string | null
  created_at: string
}

export interface Transfer {
  id: number
  user_id: string
  from_source_id: number
  to_source_id: number
  amount: number
  fee: number
  date: string
  note: string | null
  from_source_name: string
  to_source_name: string
  created_at: string
}

export interface DashboardData {
  totalBalance: number
  monthlyData: { month: string; income: number; expense: number }[]
  categoryData: { category: string; color: string; amount: number }[]
  recentTransactions: Transaction[]
}

export interface TransactionQuery {
  type?: string
  category_id?: string
  source_id?: string
  from?: string
  to?: string
  limit?: string
  offset?: string
}

export interface CreateTransactionData {
  type: 'income' | 'expense'
  title: string
  description?: string
  amount: number
  date: string
  category_id?: number
  source_id: number
}

export interface CreateSourceData {
  name: string
  type: 'cash' | 'bank' | 'card' | 'mobile'
  details?: Record<string, string>
  balance?: number
}

export interface CreateTransferData {
  from_source_id: number
  to_source_id: number
  amount: number
  fee?: number
  date: string
  note?: string
}
