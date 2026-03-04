import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth'
import authRoutes from './routes/auth'
import sourcesRoutes from './routes/sources'
import categoriesRoutes from './routes/categories'
import transactionsRoutes from './routes/transactions'
import transfersRoutes from './routes/transfers'
import dashboardRoutes from './routes/dashboard'
import fixedExpensesRoutes from './routes/fixedExpenses'

type Env = {
  DB: D1Database
  JWT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  FRONTEND_URL: string
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

// CORS for local dev
app.use('/api/*', cors({
  origin: (origin) => origin,
  credentials: true,
}))

// Auth routes (no middleware required)
app.route('/api/auth', authRoutes)

// Protected API routes
app.use('/api/*', authMiddleware)
app.route('/api/sources', sourcesRoutes)
app.route('/api/categories', categoriesRoutes)
app.route('/api/transactions', transactionsRoutes)
app.route('/api/transfers', transfersRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/fixed-expenses', fixedExpensesRoutes)

// Serve frontend assets for all non-API routes
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
