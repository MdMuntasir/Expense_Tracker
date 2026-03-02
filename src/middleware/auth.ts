import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('userId', payload.sub as string)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

function getCookie(c: Context, name: string): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined
  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=')
    if (key.trim() === name) return rest.join('=')
  }
  return undefined
}
