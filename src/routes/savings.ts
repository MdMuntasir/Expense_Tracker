import { Hono } from 'hono'

type Env = { DB: D1Database }
type Variables = { userId: string }

const savings = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/savings
savings.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(`
    SELECT sv.*, s.name as transferred_source_name
    FROM savings sv
    LEFT JOIN sources s ON sv.transferred_source_id = s.id
    WHERE sv.user_id = ?
    ORDER BY sv.month DESC, sv.created_at DESC
  `).bind(userId).all()
  return c.json(rows.results)
})

// POST /api/savings
savings.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as {
    label: string
    amount: number
    month: string
    notes?: string
  }

  if (!body.label || !body.amount || !body.month) {
    return c.json({ error: 'label, amount, and month are required' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO savings (user_id, label, amount, month, notes)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, body.label, body.amount, body.month, body.notes ?? null).run()

  const created = await c.env.DB.prepare(`
    SELECT sv.*, s.name as transferred_source_name
    FROM savings sv
    LEFT JOIN sources s ON sv.transferred_source_id = s.id
    WHERE sv.id = ?
  `).bind(result.meta.last_row_id).first()

  return c.json(created, 201)
})

// PUT /api/savings/:id
savings.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json() as {
    label?: string
    amount?: number
    month?: string
    notes?: string | null
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM savings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as Record<string, unknown> | null

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await c.env.DB.prepare(`
    UPDATE savings SET label = ?, amount = ?, month = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).bind(
    body.label ?? existing.label,
    body.amount ?? existing.amount,
    body.month ?? existing.month,
    'notes' in body ? (body.notes ?? null) : existing.notes,
    id, userId
  ).run()

  const updated = await c.env.DB.prepare(`
    SELECT sv.*, s.name as transferred_source_name
    FROM savings sv
    LEFT JOIN sources s ON sv.transferred_source_id = s.id
    WHERE sv.id = ?
  `).bind(id).first()

  return c.json(updated)
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

// POST /api/savings/:id/transfer — deposit saving into a money source
savings.post('/:id/transfer', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json() as { source_id: number; date: string }

  if (!body.source_id || !body.date) {
    return c.json({ error: 'source_id and date are required' }, 400)
  }

  const sv = await c.env.DB.prepare(
    'SELECT * FROM savings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as {
    id: number; label: string; amount: number; transferred_source_id: number | null
  } | null

  if (!sv) return c.json({ error: 'Not found' }, 404)
  if (sv.transferred_source_id) return c.json({ error: 'Already transferred' }, 400)

  const source = await c.env.DB.prepare(
    'SELECT id FROM sources WHERE id = ? AND user_id = ?'
  ).bind(body.source_id, userId).first()
  if (!source) return c.json({ error: 'Source not found' }, 404)

  // Create income transaction on the target source
  await c.env.DB.prepare(`
    INSERT INTO transactions (user_id, type, title, amount, date, source_id)
    VALUES (?, 'income', ?, ?, ?, ?)
  `).bind(userId, `Savings: ${sv.label}`, sv.amount, body.date, body.source_id).run()

  // Update source balance
  await c.env.DB.prepare(
    'UPDATE sources SET balance = balance + ? WHERE id = ?'
  ).bind(sv.amount, body.source_id).run()

  // Mark saving as transferred
  await c.env.DB.prepare(`
    UPDATE savings SET transferred_source_id = ?, transferred_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(body.source_id, id, userId).run()

  return c.json({ ok: true })
})

export default savings
