import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const transfers = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/transfers
transfers.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(`
    SELECT tr.*,
      fs.name as from_source_name,
      ts.name as to_source_name
    FROM transfers tr
    JOIN sources fs ON tr.from_source_id = fs.id
    JOIN sources ts ON tr.to_source_id = ts.id
    WHERE tr.user_id = ?
    ORDER BY tr.date DESC, tr.created_at DESC
  `).bind(userId).all()
  return c.json(rows.results)
})

// POST /api/transfers
transfers.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as {
    from_source_id: number
    to_source_id: number
    amount: number
    fee?: number
    date: string
    note?: string
  }

  if (!body.from_source_id || !body.to_source_id || !body.amount || !body.date) {
    return c.json({ error: 'from_source_id, to_source_id, amount, date are required' }, 400)
  }

  if (body.from_source_id === body.to_source_id) {
    return c.json({ error: 'Source and destination must be different' }, 400)
  }

  const fee = body.fee ?? 0

  // Verify sources belong to user
  const fromSource = await c.env.DB.prepare(
    'SELECT * FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.from_source_id, userId).first() as { balance: number } | null

  const toSource = await c.env.DB.prepare(
    'SELECT * FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.to_source_id, userId).first()

  if (!fromSource || !toSource) return c.json({ error: 'Source not found' }, 404)

  // Insert transfer record
  const transfer = await c.env.DB.prepare(`
    INSERT INTO transfers (user_id, from_source_id, to_source_id, amount, fee, date, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    userId,
    body.from_source_id,
    body.to_source_id,
    body.amount,
    fee,
    body.date,
    body.note ?? null
  ).first()

  // Deduct from source (amount + fee)
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance - ? WHERE id = ?'
  ).bind(body.amount + fee, body.from_source_id).run()

  // Add to destination source
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ?'
  ).bind(body.amount, body.to_source_id).run()

  // Auto-create fee expense transaction if fee > 0
  if (fee > 0) {
    // Get or create a "Transfer Fee" category
    let feeCat = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE user_id = ? AND name = 'Transfer Fee'"
    ).bind(userId).first() as { id: number } | null

    if (!feeCat) {
      feeCat = await c.env.DB.prepare(
        "INSERT INTO categories (user_id, name, color) VALUES (?, 'Transfer Fee', '#EF4444') RETURNING *"
      ).bind(userId).first() as { id: number }
    }

    await c.env.DB.prepare(`
      INSERT INTO transactions (user_id, type, title, amount, date, category_id, source_id)
      VALUES (?, 'expense', 'Transfer Fee', ?, ?, ?, ?)
    `).bind(userId, fee, body.date, feeCat.id, body.from_source_id).run()
  }

  return c.json(transfer, 201)
})

export default transfers
