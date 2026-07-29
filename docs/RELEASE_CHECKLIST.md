# Release Checklist

Use before every production deploy.

## Security

- [ ] No `VITE_ADMIN_PASSWORD`, `VITE_ANTHROPIC_*`, or service-role keys in Vercel
- [ ] `.env.example` is the only env template committed
- [ ] Admin route (`#admin` / `/admin`) shows **Access disabled** (until P1 secure auth ships)
- [ ] Anthropic / admin credentials rotated if they were ever client-exposed
- [ ] Supabase RLS policies applied from `supabase/schema.sql` (if cloud enabled)
- [ ] Forms webhook (if used) is authenticated server-side

## Quality gates

- [ ] `npm ci` (or `npm install`) succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] `npm run test:e2e` passes (landing renders; admin disabled) — requires Playwright-supported OS (macOS 13+, Linux, or Windows CI)
- [ ] Manual smoke: marketing landing loads on production URL

## Configuration

- [ ] Vercel env: only public `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_FORMS_WEBHOOK_URL`
- [ ] `vercel.json` SPA rewrite present
- [ ] Preview and Production env reviewed separately

## Functional smoke

- [ ] Landing / marketing view renders brand + primary CTA
- [ ] Hash navigation between core views works
- [ ] Sign-up / sign-in works in intended auth mode (local demo vs Supabase)
- [ ] Workshop data persists after refresh (localStorage)
- [ ] With Supabase: workspace syncs for signed-in user
- [ ] Forms submit without throwing (simulated or webhook)
- [ ] Admin unlock password form is **absent**

## Rollback

- [ ] Previous Vercel deployment identified
- [ ] Plan to instant-rollback if auth or data regressions appear

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Product | | |

## Post-release

- [ ] Confirm production `#admin` still disabled (or securely auth’d after P1)
- [ ] Monitor Vercel logs / Supabase auth errors for 24h
- [ ] File follow-ups in [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md)
