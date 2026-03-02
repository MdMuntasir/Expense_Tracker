import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const transactions = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/transactions
transactions.get('/', async (c) => {
  const userId = c.get('userId')
  const { type, category_id, source_id, from, to, limit = '50', offset = '0' } = c.req.query()

  let query = `
    SELECT t.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN sources s ON t.source_id = s.id
    WHERE t.user_id = ?
  `
  const params: (string | number)[] = [userId]

  if (type) { query += ' AND t.type = ?'; params.push(type) }
  if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id) }
  if (source_id) { query += ' AND t.source_id = ?'; params.push(source_id) }
  if (from) { query += ' AND t.date >= ?'; params.push(from) }
  if (to) { query += ' AND t.date <= ?'; params.push(to) }

  query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  const rows = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(rows.results)
})

// POST /api/transactions
transactions.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as {
    type: 'income' | 'expense'
    title: string
    description?: string
    amount: number
    date: string
    category_id?: number
    source_id: number
  }

  if (!body.type || !body.title || !body.amount || !body.date || !body.source_id) {
    return c.json({ error: 'type, title, amount, date, source_id are required' }, 400)
  }

  // Verify source belongs to user
  const source = await c.env.DB.prepare(
    'SELECT * FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.source_id, userId).first()
  if (!source) return c.json({ error: 'Source not found' }, 404)

  // Insert transaction
  const tx = await c.env.DB.prepare(`
    INSERT INTO transactions (user_id, type, title, description, amount, date, category_id, source_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    userId,
    body.type,
    body.title,
    body.description ?? null,
    body.amount,
    body.date,
    body.category_id ?? null,
    body.source_id
  ).first()

  // Update source balance
  const delta = body.type === 'income' ? body.amount : -body.amount
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ?'
  ).bind(delta, body.source_id).run()

  return c.json(tx, 201)
})

// DELETE /api/transactions/:id
transactions.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const tx = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as { type: string; amount: number; source_id: number } | null

  if (!tx) return c.json({ error: 'Not found' }, 404)

  // Reverse balance
  const delta = tx.type === 'income' ? -tx.amount : tx.amount
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ?'
  ).bind(delta, tx.source_id).run()

  await c.env.DB.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ ok: true })
})

export default transactions
