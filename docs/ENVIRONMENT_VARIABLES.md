# Environment Variables

Copy `.env.example` to `.env.local` for local development. Never commit real `.env` files.

## Browser-safe (Vite / Vercel)

| Variable | Required | Where |
|----------|----------|--------|
| `VITE_SUPABASE_URL` | Staging/Prod | Vercel + `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Staging/Prod | Vercel + `.env.local` |
| `VITE_FORMS_WEBHOOK_URL` | No | Vercel + `.env.local` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Vercel (Checkout UI later) |

Validated by `src/lib/env.ts`.

## Server-only shell / CLI (never VITE_, never commit)

| Variable | Used by |
|----------|---------|
| `SUPABASE_URL` | `admin:promote-owner`, `stripe:reconcile` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same — **service role** |
| `STRIPE_SECRET_KEY` | `stripe:reconcile` |

## Supabase Edge Function secrets

| Variable | Function |
|----------|----------|
| `ANTHROPIC_API_KEY` | `ask-claude` |
| `ANTHROPIC_MODEL` | `ask-claude` (allowlisted) |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` |
| `STRIPE_SECRET_KEY` | optional reconcile paths |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` | tier mapping |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | auto-injected on hosted functions |

## Test-only

| Variable | Used by |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | `npm run test:e2e:staging` |
| `E2E_PLATFORM_OWNER_EMAIL` / `PASSWORD` | Staging admin login |
| `E2E_STANDARD_USER_EMAIL` / `PASSWORD` | Non-admin denial |

## Forbidden on the client

`src/lib/env.ts` rejects non-empty:

- `VITE_ADMIN_PASSWORD`
- `VITE_ANTHROPIC_*`
- `VITE_OPENAI_API_KEY`
- `VITE_SERVICE_ROLE_KEY` / `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_STRIPE_SECRET_KEY` / `VITE_STRIPE_WEBHOOK_SECRET`

See [AUTH_SETUP.md](./AUTH_SETUP.md) and [STAGING_CHECKLIST.md](./STAGING_CHECKLIST.md).
