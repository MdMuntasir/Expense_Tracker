import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { api, User } from './api/client'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Sources from './pages/Sources'
import Categories from './pages/Categories'
import FixedExpenses from './pages/FixedExpenses'
import Layout from './components/layout/Layout'

interface AuthContextValue {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
})

export const useAuth = () => useContext(AuthContext)

interface ThemeContextValue {
  dark: boolean
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({ dark: false, toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    api.getMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
    <AuthContext.Provider value={{ user, loading, setUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/sources" element={<Sources />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/fixed-expenses" element={<FixedExpenses />} />
                  </Routes>
                </Layout>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
