import { Hono } from 'hono'

type Env = { DB: D1Database }
type Variables = { userId: string }

const savings = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/savings
savings.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(`
    SELECT * FROM savings
    WHERE user_id = ?
    ORDER BY target_date ASC, created_at DESC
  `).bind(userId).all()
  return c.json(rows.results)
})

// POST /api/savings
savings.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as {
    title: string
    amount: number
    target_date: string
    notes?: string
  }

  if (!body.title || !body.amount || !body.target_date) {
    return c.json({ error: 'title, amount, and target_date are required' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO savings (user_id, title, amount, target_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, body.title, body.amount, body.target_date, body.notes ?? null).run()

  const created = await c.env.DB.prepare(
    'SELECT * FROM savings WHERE id = ?'
  ).bind(result.meta.last_row_id).first()

  return c.json(created, 201)
})

// PUT /api/savings/:id
savings.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json() as {
    title?: string
    amount?: number
    target_date?: string
    notes?: string | null
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM savings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as Record<string, unknown> | null

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await c.env.DB.prepare(`
    UPDATE savings SET title = ?, amount = ?, target_date = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).bind(
    body.title ?? existing.title,
    body.amount ?? existing.amount,
    body.target_date ?? existing.target_date,
    'notes' in body ? (body.notes ?? null) : existing.notes,
    id, userId
  ).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM savings WHERE id = ?'
  ).bind(id).first()

  return c.json(updated)
})

// POST /api/savings/:id/transfer — create income transaction from saving amount, then delete the saving
savings.post('/:id/transfer', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json() as { source_id: number; date: string }

  if (!body.source_id || !body.date) {
    return c.json({ error: 'source_id and date are required' }, 400)
  }

  const saving = await c.env.DB.prepare(
    'SELECT * FROM savings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as { id: number; title: string; amount: number } | null

  if (!saving) return c.json({ error: 'Not found' }, 404)

  const source = await c.env.DB.prepare(
    'SELECT id FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.source_id, userId).first()

  if (!source) return c.json({ error: 'Source not found' }, 404)

  await c.env.DB.prepare(`
    INSERT INTO transactions (user_id, type, title, amount, date, source_id)
    VALUES (?, 'income', ?, ?, ?, ?)
  `).bind(userId, saving.title, saving.amount, body.date, body.source_id).run()

  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ? AND user_id = ?'
  ).bind(saving.amount, body.source_id, userId).run()

  await c.env.DB.prepare('DELETE FROM savings WHERE id = ? AND user_id = ?').bind(id, userId).run()

  return c.json({ ok: true })
})

// DELETE /api/savings/:id
savings.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))

  const existing = await c.env.DB.prepare(
    'SELECT id FROM savings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first()

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await c.env.DB.prepare('DELETE FROM savings WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ ok: true })
})

export default savings
