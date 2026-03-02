import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

type Variables = {
  userId: string
}

const categories = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/categories
categories.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC'
  ).bind(userId).all()
  return c.json(rows.results)
})

// POST /api/categories
categories.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json() as { name: string; color?: string }

  if (!body.name) return c.json({ error: 'name is required' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?) RETURNING *'
  ).bind(userId, body.name, body.color ?? '#6B7280').first()

  return c.json(result, 201)
})

// DELETE /api/categories/:id
categories.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const category = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first()

  if (!category) return c.json({ error: 'Not found' }, 404)

  const txCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?'
  ).bind(id).first() as { count: number }

  if (txCount.count > 0) {
    return c.json({ error: `This category is used by ${txCount.count} transaction(s)` }, 400)
  }

  await c.env.DB.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ ok: true })
})

export default categories
