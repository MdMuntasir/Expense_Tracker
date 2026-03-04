import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const dashboard = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/dashboard
dashboard.get('/', async (c) => {
  const userId = c.get('userId')

  // Total balance across all sources
  const balanceResult = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(balance), 0) as total FROM sources WHERE user_id = ?'
  ).bind(userId).first() as { total: number }

  // Monthly income/expense — last 6 months
  const monthlyData = await c.env.DB.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    WHERE user_id = ?
      AND date >= date('now', '-5 months', 'start of month')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).bind(userId).all()

  // Category spending — all time
  const categoryData = await c.env.DB.prepare(`
    SELECT
      COALESCE(c.name, 'Uncategorized') as category,
      COALESCE(c.color, '#6B7280') as color,
      SUM(t.amount) as amount
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
      AND t.type = 'expense'
    GROUP BY t.category_id
    ORDER BY amount DESC
  `).bind(userId).all()

  // Recent 5 transactions
  const recentTx = await c.env.DB.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN sources s ON t.source_id = s.id
    WHERE t.user_id = ?
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 5
  `).bind(userId).all()

  // Fixed expenses aggregation
  const fixedExpAgg = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM fixed_expenses
    WHERE user_id = ? AND is_active = 1
  `).bind(userId).first() as { total: number; count: number }

  const fixedExpList = await c.env.DB.prepare(`
    SELECT fe.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM fixed_expenses fe
    LEFT JOIN categories c ON fe.category_id = c.id
    LEFT JOIN sources s ON fe.source_id = s.id
    WHERE fe.user_id = ? AND fe.is_active = 1
    ORDER BY fe.next_due_date ASC, fe.created_at DESC
  `).bind(userId).all()

  return c.json({
    totalBalance: balanceResult.total,
    monthlyData: monthlyData.results,
    categoryData: categoryData.results,
    recentTransactions: recentTx.results,
    fixedExpensesTotal: fixedExpAgg.total,
    fixedExpensesCount: fixedExpAgg.count,
    availableBalance: balanceResult.total - fixedExpAgg.total,
    fixedExpenses: fixedExpList.results,
  })
})

export default dashboard
