import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const sources = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/sources
sources.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(
    'SELECT * FROM sources WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
  ).bind(userId).all()
  return c.json(rows.results)
})

// POST /api/sources
sources.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as {
    name: string
    type: 'cash' | 'bank' | 'card' | 'mobile'
    details?: Record<string, string>
    balance?: number
  }

  if (!body.name || !body.type) {
    return c.json({ error: 'name and type are required' }, 400)
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO sources (user_id, name, type, details, balance) VALUES (?, ?, ?, ?, ?) RETURNING *'
  ).bind(
    userId,
    body.name,
    body.type,
    body.details ? JSON.stringify(body.details) : null,
    body.balance ?? 0
  ).first()

  return c.json(result, 201)
})

// PUT /api/sources/:id
sources.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = await c.req.json() as {
    name?: string
    type?: string
    details?: Record<string, string>
  }

  const source = await c.env.DB.prepare(
    'SELECT * FROM sources WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first()

  if (!source) return c.json({ error: 'Not found' }, 404)

  const result = await c.env.DB.prepare(`
    UPDATE sources
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        details = COALESCE(?, details)
    WHERE id = ? AND user_id = ?
    RETURNING *
  `).bind(
    body.name ?? null,
    body.type ?? null,
    body.details ? JSON.stringify(body.details) : null,
    id,
    userId
  ).first()

  return c.json(result)
})

// DELETE /api/sources/:id
sources.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const source = await c.env.DB.prepare(
    'SELECT * FROM sources WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first() as { balance: number; is_default: number } | null

  if (!source) return c.json({ error: 'Not found' }, 404)
  if (source.is_default) return c.json({ error: 'Cannot delete default source' }, 400)
  if (source.balance !== 0) return c.json({ error: 'Source balance must be 0 before deletion' }, 400)

  const txCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE source_id = ?'
  ).bind(id).first() as { count: number }

  if (txCount.count > 0) return c.json({ error: 'Source has transactions' }, 400)

  await c.env.DB.prepare('DELETE FROM sources WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ ok: true })
})

export default sources
