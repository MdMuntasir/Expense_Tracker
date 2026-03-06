# Expense Tracker

A personal finance web app to track your income, expenses, and money sources. Built on Cloudflare Workers for fast, global performance.

---

## Features

- **Dashboard** — See your total balance, available balance, monthly income vs expense trends, and spending by category at a glance
- **Transactions** — Log income and expenses with categories, notes, and the source they came from. Filter by type, category, source, or date range
- **Money Sources** — Track balances across cash, bank accounts, cards, and mobile wallets all in one place
- **Transfers** — Move money between your sources. Transfer fees are automatically recorded as expenses
- **Fixed Expenses** — Plan ahead for recurring costs like rent or subscriptions. Your available balance automatically deducts these so you know what's truly free to spend
- **Categories** — Create custom categories with colors to organize your spending
- **Dark Mode** — Switch between light and dark themes
- **Multi-user** — Each user's data is completely private. Sign in with your Google account — no password needed

---

## Self-Hosting

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Cloudflare account](https://cloudflare.com) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) — install with `npm install -g wrangler`
- A Google Cloud project with OAuth 2.0 credentials ([guide](https://developers.google.com/identity/protocols/oauth2))

### 1. Clone and install

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
npm install
cd frontend && npm install && cd ..
```

### 2. Create the database

```bash
wrangler d1 create expense-tracker-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
database_id = "PASTE_YOUR_ID_HERE"
```

Then run the migrations:

```bash
npm run db:migrate:local   # local dev
npm run db:migrate         # production
```

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create OAuth 2.0 credentials (Web application)
2. Add these to your **Authorized redirect URIs**:
   - Local: `http://localhost:8787/api/auth/google/callback`
   - Production: `https://your-worker.workers.dev/api/auth/google/callback`

### 4. Set your secrets

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET          # any long random string
```

### 5. Update the frontend URL

In `wrangler.toml`, set `FRONTEND_URL` to your deployed worker URL:

```toml
[vars]
FRONTEND_URL = "https://your-worker.workers.dev"
```

### Run locally

```bash
npm run dev             # starts the worker at localhost:8787
cd frontend && npm run dev   # starts the frontend at localhost:5173
```

### Deploy to Cloudflare

```bash
npm run deploy
```
---

## License

[MIT](LICENSE)
