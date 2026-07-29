# Environment Variables

Copy `.env.example` to `.env.local` for local development. Never commit real `.env` files.

## Client (Vite) — public only

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Public anon key (pair with RLS) |
| `VITE_FORMS_WEBHOOK_URL` | No | Forms POST endpoint |

Validated at runtime by `src/lib/env.ts` (`getClientEnv` / `parseClientEnv`).

## Forbidden on the client

Do **not** set these (validator throws if non-empty):

| Variable | Why forbidden |
|----------|----------------|
| `VITE_ADMIN_PASSWORD` | Client-visible; bypassable |
| `VITE_ANTHROPIC_API_KEY` | Full API key in bundle |
| `VITE_ANTHROPIC_KEY` | Same |
| `VITE_OPENAI_API_KEY` | Same class of secret |
| `VITE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |

## Server-only (future)

When Prompt 2 adds Edge Functions / API routes, keep these **off** `VITE_`:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Server proxy for Ask Claude |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin mutations only on server |
| `ADMIN_ALLOWLIST` / role claims | Server authorization |

## Vercel configuration

1. Project → Settings → Environment Variables
2. Add only the three public `VITE_*` values above for Production/Preview as needed
3. **Remove** any previously set `VITE_ADMIN_PASSWORD` or `VITE_ANTHROPIC_API_KEY`
4. Redeploy so the client bundle no longer embeds old secrets

## Local setup

```bash
cp .env.example .env.local
# edit .env.local with public values only
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm run test          # includes forbidden-secret unit tests
npm run validate
```
