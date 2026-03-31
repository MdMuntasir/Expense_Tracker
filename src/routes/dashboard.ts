import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const dashboard = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
dashboard.get('/', async (c) => {
  const userId = c.get('userId')
  const from = c.req.query('from') || null
  const to = c.req.query('to') || null

  // Total balance across all sources (always current, not date-filtered)
  const balanceResult = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(balance), 0) as total FROM sources WHERE user_id = ?'
  ).bind(userId).first() as { total: number }

  // Monthly income/expense — filtered by range if given, else last 6 months
  let monthlyQuery = `
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    WHERE user_id = ?`

  const monthlyBinds: (string | number)[] = [userId]

  if (from && to) {
    monthlyQuery += ' AND date >= ? AND date <= ?'
    monthlyBinds.push(from, to)
  } else {
    monthlyQuery += " AND date >= date('now', '-5 months', 'start of month')"
  }
  monthlyQuery += ' GROUP BY strftime(\'%Y-%m\', date) ORDER BY month ASC'

  const monthlyData = await c.env.DB.prepare(monthlyQuery).bind(...monthlyBinds).all()

  // Category spending — filtered by range if given, else all time
  let catQuery = `
    SELECT
      COALESCE(c.name, 'Uncategorized') as category,
      COALESCE(c.color, '#6B7280') as color,
      SUM(t.amount) as amount
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
      AND t.type = 'expense'`

  const catBinds: (string | number)[] = [userId]

  if (from && to) {
    catQuery += ' AND t.date >= ? AND t.date <= ?'
    catBinds.push(from, to)
  }
  catQuery += ' GROUP BY t.category_id ORDER BY amount DESC'

  const categoryData = await c.env.DB.prepare(catQuery).bind(...catBinds).all()

  // Recent 5 transactions — filtered by range if given
  let recentQuery = `
    SELECT t.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN sources s ON t.source_id = s.id
    WHERE t.user_id = ?`

  const recentBinds: (string | number)[] = [userId]

  if (from && to) {
    recentQuery += ' AND t.date >= ? AND t.date <= ?'
    recentBinds.push(from, to)
  }
  recentQuery += ' ORDER BY t.date DESC, t.created_at DESC LIMIT 5'

  const recentTx = await c.env.DB.prepare(recentQuery).bind(...recentBinds).all()

  // Fixed expenses aggregation (always current, not date-filtered)
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

  // Active savings targets (target_date not yet passed)
  let currentSavingsTarget = 0
  try {
    const savingsAgg = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM savings
      WHERE user_id = ? AND target_date >= date('now')
    `).bind(userId).first() as { total: number }
    currentSavingsTarget = savingsAgg.total
  } catch {
    // savings table may not exist yet — migration pending
  }

  // Today's total expenses
  const todayAgg = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND date = date('now')
  `).bind(userId).first() as { total: number }

  // Remaining days: from today to the period end date (inclusive), or real month end if no range
  let remainingDays: number
  if (to) {
    const daysAgg = await c.env.DB.prepare(`
      SELECT CAST(julianday(?) - julianday(date('now')) AS INTEGER) + 1 as remaining_days
    `).bind(to).first() as { remaining_days: number }
    remainingDays = Math.max(1, daysAgg.remaining_days)
  } else {
    const daysAgg = await c.env.DB.prepare(`
      SELECT
        CAST(strftime('%d', date('now', 'start of month', '+1 month', '-1 day')) AS INTEGER) -
        CAST(strftime('%d', 'now') AS INTEGER) + 1 as remaining_days
    `).first() as { remaining_days: number }
    remainingDays = Math.max(1, daysAgg.remaining_days)
  }

  return c.json({
    totalBalance: balanceResult.total,
    monthlyData: monthlyData.results,
    categoryData: categoryData.results,
    recentTransactions: recentTx.results,
    fixedExpensesTotal: fixedExpAgg.total,
    fixedExpensesCount: fixedExpAgg.count,
    availableBalance: balanceResult.total - fixedExpAgg.total - currentSavingsTarget,
    fixedExpenses: fixedExpList.results,
    currentSavingsTarget,
    todayExpenses: todayAgg.total,
    remainingDaysInMonth: remainingDays,
  })
})

export default dashboard
