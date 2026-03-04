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

// PUT /api/transfers/:id
transfers.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
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

  // Fetch existing transfer
  const old = await c.env.DB.prepare(
    'SELECT * FROM transfers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as {
    id: number; from_source_id: number; to_source_id: number
    amount: number; fee: number; date: string
  } | null

  if (!old) return c.json({ error: 'Transfer not found' }, 404)

  const newFee = body.fee ?? 0

  // Verify new sources belong to user
  const newFrom = await c.env.DB.prepare(
    'SELECT id FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.from_source_id, userId).first()

  const newTo = await c.env.DB.prepare(
    'SELECT id FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.to_source_id, userId).first()

  if (!newFrom || !newTo) return c.json({ error: 'Source not found' }, 404)

  // Reverse old balance effects
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ? AND user_id = ?'
  ).bind(old.amount + old.fee, old.from_source_id, userId).run()

  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance - ? WHERE id = ? AND user_id = ?'
  ).bind(old.amount, old.to_source_id, userId).run()

  // Apply new balance effects
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance - ? WHERE id = ? AND user_id = ?'
  ).bind(body.amount + newFee, body.from_source_id, userId).run()

  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ? AND user_id = ?'
  ).bind(body.amount, body.to_source_id, userId).run()

  // Handle fee expense transaction: delete old, create new
  if (old.fee > 0) {
    await c.env.DB.prepare(`
      DELETE FROM transactions
      WHERE user_id = ? AND title = 'Transfer Fee' AND amount = ? AND source_id = ? AND date = ?
      LIMIT 1
    `).bind(userId, old.fee, old.from_source_id, old.date).run()
  }

  if (newFee > 0) {
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
    `).bind(userId, newFee, body.date, feeCat.id, body.from_source_id).run()
  }

  // Update the transfer record
  const updated = await c.env.DB.prepare(`
    UPDATE transfers
    SET from_source_id = ?, to_source_id = ?, amount = ?, fee = ?, date = ?, note = ?
    WHERE id = ? AND user_id = ?
    RETURNING *
  `).bind(
    body.from_source_id,
    body.to_source_id,
    body.amount,
    newFee,
    body.date,
    body.note ?? null,
    id,
    userId
  ).first()

  return c.json(updated)
})

// DELETE /api/transfers/:id
transfers.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))

  const transfer = await c.env.DB.prepare(
    'SELECT * FROM transfers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as {
    id: number; from_source_id: number; to_source_id: number
    amount: number; fee: number; date: string
  } | null

  if (!transfer) return c.json({ error: 'Transfer not found' }, 404)

  // Reverse balance effects
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ? AND user_id = ?'
  ).bind(transfer.amount + transfer.fee, transfer.from_source_id, userId).run()

  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance - ? WHERE id = ? AND user_id = ?'
  ).bind(transfer.amount, transfer.to_source_id, userId).run()

  // Delete associated fee transaction if any
  if (transfer.fee > 0) {
    await c.env.DB.prepare(`
      DELETE FROM transactions
      WHERE user_id = ? AND title = 'Transfer Fee' AND amount = ? AND source_id = ? AND date = ?
      LIMIT 1
    `).bind(userId, transfer.fee, transfer.from_source_id, transfer.date).run()
  }

  await c.env.DB.prepare(
    'DELETE FROM transfers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run()

  return c.json({ ok: true })
})

export default transfers
