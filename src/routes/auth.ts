import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Env = {
  DB: D1Database
  JWT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  FRONTEND_URL: string
}

const auth = new Hono<{ Bindings: Env }>()

// GET /api/auth/google — redirect to Google OAuth
auth.get('/google', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${new URL(c.req.url).origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// GET /api/auth/google/callback — exchange code for tokens
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  const origin = new URL(c.req.url).origin

  if (!code) {
    return c.redirect(`${origin}/login?error=no_code`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error('[auth] Token exchange failed:', tokenRes.status, errBody)
    return c.redirect(`${origin}/login?error=token_exchange`)
  }

  const tokens = await tokenRes.json() as { access_token: string }

  // Fetch user profile
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!profileRes.ok) {
    console.error('[auth] Profile fetch failed:', profileRes.status)
    return c.redirect(`${origin}/login?error=profile_fetch`)
  }

  const profile = await profileRes.json() as {
    id: string
    name: string
    email: string
    picture: string
  }

  // Check if this is a new user (no sources yet)
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE id = ?'
  ).bind(profile.id).first()

  // Upsert user
  await c.env.DB.prepare(`
    INSERT INTO users (id, name, email, avatar)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      avatar = excluded.avatar
  `).bind(profile.id, profile.name, profile.email, profile.picture).run()

  // Seed defaults for new users
  if (!existing) {
    await c.env.DB.prepare(
      'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)'
    ).bind(profile.id, 'General', '#6B7280').run()

    await c.env.DB.prepare(
      'INSERT INTO sources (user_id, name, type, is_default, balance) VALUES (?, ?, ?, ?, ?)'
    ).bind(profile.id, 'Cash', 'cash', 1, 0).run()
  }

  // Sign JWT
  const jwt = await sign(
    { sub: profile.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    c.env.JWT_SECRET
  )

  // Set cookie and redirect back to the same origin (works for both local dev and production)
  setCookie(c, 'token', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  console.log('[auth] Login success, user:', profile.id, 'new:', !existing)
  return c.redirect(origin + '/')
})

// GET /api/auth/me
auth.get('/me', async (c) => {
  const token = getCookie(c, 'token')
  if (!token) return c.json({ user: null })

  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, avatar FROM users WHERE id = ?'
    ).bind(payload.sub).first()
    if (!user) console.warn('[auth] /me: JWT valid but user not found in DB, sub:', payload.sub)
    return c.json({ user })
  } catch (err) {
    console.error('[auth] /me: JWT verification failed:', err)
    return c.json({ user: null })
  }
})

// POST /api/auth/logout
auth.post('/logout', (c) => {
  deleteCookie(c, 'token', { path: '/' })
  return c.json({ ok: true })
})

export default auth
