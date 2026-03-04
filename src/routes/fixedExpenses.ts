import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const fixedExpenses = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/fixed-expenses
fixedExpenses.get('/', async (c) => {
  const userId = c.get('userId')
  const showInactive = c.req.query('inactive') === '1'

  const rows = await c.env.DB.prepare(`
    SELECT fe.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM fixed_expenses fe
    LEFT JOIN categories c ON fe.category_id = c.id
    LEFT JOIN sources s ON fe.source_id = s.id
    WHERE fe.user_id = ?
      AND fe.is_active = ?
    ORDER BY fe.next_due_date ASC, fe.created_at DESC
  `).bind(userId, showInactive ? 0 : 1).all()

  return c.json(rows.results)
})

// POST /api/fixed-expenses
fixedExpenses.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as {
    title: string
    amount: number
    category_id?: number
    source_id?: number
    frequency?: string
    next_due_date?: string
    notes?: string
  }

  if (!body.title || !body.amount) {
    return c.json({ error: 'title and amount are required' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO fixed_expenses (user_id, title, amount, category_id, source_id, frequency, next_due_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    body.title,
    body.amount,
    body.category_id ?? null,
    body.source_id ?? null,
    body.frequency ?? 'one-time',
    body.next_due_date ?? null,
    body.notes ?? null,
  ).run()

  const created = await c.env.DB.prepare(`
    SELECT fe.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM fixed_expenses fe
    LEFT JOIN categories c ON fe.category_id = c.id
    LEFT JOIN sources s ON fe.source_id = s.id
    WHERE fe.id = ?
  `).bind(result.meta.last_row_id).first()

  return c.json(created, 201)
})

// PUT /api/fixed-expenses/:id
fixedExpenses.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json() as {
    title?: string
    amount?: number
    category_id?: number | null
    source_id?: number | null
    frequency?: string
    next_due_date?: string | null
    notes?: string | null
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM fixed_expenses WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as Record<string, unknown> | null

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await c.env.DB.prepare(`
    UPDATE fixed_expenses
    SET title = ?, amount = ?, category_id = ?, source_id = ?, frequency = ?, next_due_date = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).bind(
    body.title ?? existing.title,
    body.amount ?? existing.amount,
    'category_id' in body ? (body.category_id ?? null) : existing.category_id,
    'source_id' in body ? (body.source_id ?? null) : existing.source_id,
    body.frequency ?? existing.frequency,
    'next_due_date' in body ? (body.next_due_date ?? null) : existing.next_due_date,
    'notes' in body ? (body.notes ?? null) : existing.notes,
    id,
    userId,
  ).run()

  const updated = await c.env.DB.prepare(`
    SELECT fe.*, c.name as category_name, c.color as category_color, s.name as source_name
    FROM fixed_expenses fe
    LEFT JOIN categories c ON fe.category_id = c.id
    LEFT JOIN sources s ON fe.source_id = s.id
    WHERE fe.id = ?
  `).bind(id).first()

  return c.json(updated)
})

// DELETE /api/fixed-expenses/:id
fixedExpenses.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))

  const existing = await c.env.DB.prepare(
    'SELECT id FROM fixed_expenses WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first()

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await c.env.DB.prepare('DELETE FROM fixed_expenses WHERE id = ? AND user_id = ?').bind(id, userId).run()

  return c.json({ ok: true })
})

// POST /api/fixed-expenses/:id/pay — advance lifecycle
fixedExpenses.post('/:id/pay', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))

  const fe = await c.env.DB.prepare(
    'SELECT * FROM fixed_expenses WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as {
    id: number
    frequency: string
    next_due_date: string | null
    is_active: number
  } | null

  if (!fe) return c.json({ error: 'Not found' }, 404)

  if (fe.frequency === 'one-time') {
    await c.env.DB.prepare(
      'UPDATE fixed_expenses SET is_active = 0 WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run()
  } else {
    // Advance next_due_date by one frequency interval
    const base = fe.next_due_date ? new Date(fe.next_due_date) : new Date()
    let next: Date

    switch (fe.frequency) {
      case 'daily':
        next = new Date(base)
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next = new Date(base)
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next = new Date(base)
        next.setMonth(next.getMonth() + 1)
        break
      case 'yearly':
        next = new Date(base)
        next.setFullYear(next.getFullYear() + 1)
        break
      default:
        next = new Date(base)
        next.setMonth(next.getMonth() + 1)
    }

    const nextStr = next.toISOString().slice(0, 10)
    await c.env.DB.prepare(
      'UPDATE fixed_expenses SET next_due_date = ? WHERE id = ? AND user_id = ?'
    ).bind(nextStr, id, userId).run()
  }

  return c.json({ ok: true })
})

export default fixedExpenses
