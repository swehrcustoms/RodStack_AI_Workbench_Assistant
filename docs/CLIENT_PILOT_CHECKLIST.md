# Client Pilot Checklist — Before You Hand a Shop Their RodStack Portal

**Purpose:** What **you** still need to finish before you can invite a custom rod building company to use RodStack as their daily workshop software.

**Honest scope for a first client pilot:**  
The app can support a shop for **daily builds, inventory, CRM, build sheets, cure tracking, photos, and cloud sync** once Supabase + Vercel are configured and you have verified auth/data isolation.  
**Not required for a first pilot:** Shopify sync, QuickBooks sync, live Stripe checkout UI, or Ask Claude (those can come later).

Use this as your working checklist. Check items off in order.

---

## Phase A — Foundations (blockers)

Nothing else matters until these are done.

### A1. Create (or confirm) a dedicated Supabase project for clients

- [ ] Create a **staging** Supabase project (recommended for the first shop test)
- [ ] Or decide this first shop will use **production** and accept that risk
- [ ] Save Project URL and anon key somewhere secure (password manager)
- [ ] Save **service role key** for your machine only — never put it in Vercel `VITE_*` env vars

### A2. Apply database migrations

- [ ] Install Supabase CLI if needed
- [ ] Run:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

- [ ] Confirm both migrations applied:
  - `20260729120000_auth_orgs_subscriptions.sql`
  - `20260729140000_stripe_sync_and_promote_owner.sql`
- [ ] In Supabase Table Editor, confirm you see tables like `profiles`, `organizations`, `subscriptions`, `platform_admins`, `audit_logs`

### A3. Configure Auth for real users

In Supabase → Authentication:

- [ ] Enable **Email** provider
- [ ] Turn on **Confirm email** (recommended for real shops)
- [ ] Set **Site URL** to your live app URL  
  Example: `https://rod-stack-ai-workbench-assistant.vercel.app`
- [ ] Add **Redirect URLs**:
  - `https://rod-stack-ai-workbench-assistant.vercel.app/**`
  - `http://localhost:5173/**` (for your own testing)
- [ ] Confirm you can receive auth emails (or configure custom SMTP if default email is unreliable)

### A4. Point the live website at this Supabase project

In Vercel → Project → Environment Variables (Production, and Preview if you use it):

- [ ] Set `VITE_SUPABASE_URL`
- [ ] Set `VITE_SUPABASE_ANON_KEY`
- [ ] Confirm **no** service role / Anthropic / Stripe secret keys are in `VITE_*`
- [ ] **Redeploy** after saving env vars (env changes do not apply until redeploy)
- [ ] Open the live site and confirm it loads without a blank page

### A5. Make yourself platform owner

- [ ] Sign up on the live site (Profile → Create Account) with **your** email
- [ ] Confirm your email if required
- [ ] On your computer (with service role in the shell):

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
npm run admin:promote-owner -- --email you@yourdomain.com
```

- [ ] Open `/admin/login`, sign in, and confirm you reach the owner console
- [ ] Confirm a normal second account (if you create one) is **blocked** from admin

---

## Phase B — Deploy the server pieces the portal needs

### B1. Deploy Edge Functions (minimum for admin + future billing)

- [ ] From the repo:

```bash
npm run deploy:staging
```

(or deploy each function manually per `docs/AUTH_SETUP.md`)

- [ ] Confirm at least these exist in Supabase → Edge Functions:
  - admin-get-user, admin-search-users, admin-get-subscription
  - admin-refresh-entitlements, admin-manual-override
  - admin-start/end-plan-preview, admin-start/end-support-view
  - ask-claude (optional for pilot)
  - stripe-webhook (optional for pilot)

### B2. Optional for first pilot (skip if you want speed)

- [ ] Set `ANTHROPIC_API_KEY` + deploy `ask-claude` (only if you want AI during the pilot)
- [ ] Set Stripe secrets + webhook endpoint (only if you will bill this shop during the pilot)
- [ ] If skipping Stripe for now: plan to put the shop on a manual **free/pro override** from the admin console after they sign up

---

## Phase C — Prove it works yourself (before inviting a shop)

Do this as if you were the customer. Do not invite anyone until this pass is clean.

### C1. Your own workshop smoke test (happy path)

On the live URL, signed in as a normal shop user (or a second “shop” account):

- [ ] Sign up / sign in works
- [ ] Sign out works
- [ ] Password reset email works (or you have a support plan if it fails)
- [ ] Create or open a **build**
- [ ] Edit build sheet details and refresh — data still there
- [ ] Add / edit **inventory** SKUs
- [ ] Add a **customer** in CRM
- [ ] Use **spine** or **cure** tools without crashing
- [ ] Add a **photo** (know that photos are device-local IndexedDB today — tell the client that)
- [ ] Sign in on a second browser/device and confirm cloud workspace sync works when online

### C2. Tenant / privacy check (critical)

- [ ] Create a second test account (fake “other shop”)
- [ ] Confirm Shop A cannot see Shop B’s customers/builds in the UI
- [ ] Confirm admin support tools only work when **you** are platform owner
- [ ] Confirm the client will never need the service role key

### C3. Admin support readiness

As platform owner:

- [ ] Search users in `/admin/users`
- [ ] Inspect a subscription / org in `/admin/subscriptions`
- [ ] Open `/admin/audit` and confirm actions are logged when you use admin tools
- [ ] Know how you will help the client if they get locked out (password reset + your admin access)

---

## Phase D — Prepare the client’s portal invite

“Their own portal” today means: **the same RodStack app URL**, with **their own account/organization**, not a separate custom domain (unless you later set one up).

### D1. Decide the invite model

Pick one and write it down:

- [ ] **Option 1 (simplest):** Client signs up themselves at your production URL; you verify their org in admin
- [ ] **Option 2:** You create the account flow with them on a call (recommended for first shop)
- [ ] **Option 3 (later):** Custom domain like `shopname.rodstack.app` — **not built yet**; do not promise this for the first pilot

### D2. Package what you will send the client

- [ ] Live app link (production URL)
- [ ] Sign-in instructions (Profile / Create Account)
- [ ] What works today (builds, inventory, CRM, sheets, cure, photos-on-device, cloud sync)
- [ ] What does **not** work yet (Shopify import, QuickBooks, automatic Stripe self-serve portal, multi-device photo cloud library)
- [ ] How to reach you for support
- [ ] Pilot length and expectations (e.g. 2–4 weeks of daily use feedback)

### D3. Create their access

- [ ] Client creates account with their shop email
- [ ] They confirm email
- [ ] You find them in `/admin/users`
- [ ] You note their **organization id**
- [ ] If billing later: set their plan (Stripe or manual override)
- [ ] If they need a second employee: they invite/add under the same shop process you define (today: separate accounts may be separate orgs unless you add them to the same org in the database — **verify this before promising multi-user shops**)

> **Important multi-user note:** Signup currently creates a **personal organization** for each new user. If the shop needs 2+ builders on one shared shop account, you must either (1) manually add the second user to the first user’s organization in Supabase, or (2) delay multi-user shops until that invite flow is built. Check this before promising “whole shop login.”

---

## Phase E — Client handoff day

- [ ] 30–60 minute walkthrough: sign in, create one real blank/build, add inventory, add a customer
- [ ] Confirm they can log in again the next morning without you
- [ ] Schedule a check-in (3 days / 1 week)
- [ ] Keep your platform-owner login working for support
- [ ] Have a rollback plan (Vercel previous deploy) if a release breaks them

---

## Phase F — Explicitly NOT required before first client pilot

Do **not** block the first shop on these:

- [ ] Shopify order sync — **Planned**
- [ ] QuickBooks accounting sync — **Planned**
- [ ] Ask Claude live — optional
- [ ] Stripe Customer Portal self-serve — optional if you invoice manually
- [ ] Custom subdomain per client — not built
- [ ] Full Next.js rewrite — not applicable; current app is Vite SPA
- [ ] Perfect multi-device photo cloud storage — photos are local to the device for now

---

## Definition of “ready to invite a shop”

You are ready when **all** of these are true:

1. Live site uses a real Supabase project with migrations applied  
2. You are platform owner and can open `/admin/login`  
3. A test shop account can complete a full daily workflow without crashing  
4. Two accounts cannot see each other’s shop data  
5. You have a written invite + “what works / what doesn’t” note for the client  
6. You know how multi-user will work for that shop (or you start with **one** user)

---

## Suggested order this week

| Day | Focus |
| --- | --- |
| Day 1 | A1–A5 (Supabase, Vercel env, promote yourself) |
| Day 2 | B1 + C1–C3 (functions + your smoke tests) |
| Day 3 | Fix anything broken from smoke tests |
| Day 4 | D1–D3 (invite package + first shop account) |
| Day 5 | E (handoff call) |

---

## Quick links

- App: https://rod-stack-ai-workbench-assistant.vercel.app/
- User sign-in: https://rod-stack-ai-workbench-assistant.vercel.app/#view=profile
- Admin: https://rod-stack-ai-workbench-assistant.vercel.app/admin/login
- Setup docs: `docs/AUTH_SETUP.md`, `docs/STAGING_CHECKLIST.md`
- Full stack status: `docs/TECHNOLOGY_STACK_AND_ARCHITECTURE.md`
