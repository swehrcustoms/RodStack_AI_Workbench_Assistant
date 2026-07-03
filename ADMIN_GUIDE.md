# RodStack Admin Guide

Guide for managing multi-tenant client portals via the admin dashboard.

## Accessing the Admin Portal

1. Go to `https://rodstack.app/#admin`
2. Enter the admin password (`VITE_ADMIN_PASSWORD` or your configured secret)
3. Use the **Client Portals** tab for multi-tenant management

API authentication uses `ADMIN_API_SECRET` (or Supabase JWT for emails listed in `ADMIN_EMAILS`).

## Creating a Client Portal (White-Glove)

1. Click **Create Client Portal**
2. Enter:
   - **Company Name** — used to generate slug (e.g. `acme-rod-works`)
   - **Company Email** — primary contact
   - **Owner Name** — optional display name
   - **Subscription Tier** — free through enterprise
   - **Logo URL** — optional CDN link
   - **Brand Colors** — primary and accent hex values
3. Submit — record is created with `is_white_glove = true`
4. Deployment starts automatically; status shows in client list

## Client List Dashboard

| Column | Description |
|--------|-------------|
| Slug | Portal subdomain link |
| Company | Business name |
| Tier | Subscription level |
| Deploy | `pending`, `in_progress`, `active`, `failed` |
| Created | Onboarding date |

### Filters

- **Search** — slug, company name, or email
- **Tier** — filter by subscription
- **Status** — deployment or subscription status

### Actions

- **Edit** — open client details (branding, team, activity, API usage)
- **Send** — email portal handoff template to client

## Client Details Page

- **Deployment URL** — live portal link
- **Branding** — edit logo, colors, notes
- **Team Members** — users with portal access
- **Activity Log** — audit trail (creates, deploys, tier changes)
- **API Usage** — requests this month

## Sending Portal to Client

1. Confirm deployment status is `active`
2. Preview portal at `{slug}.rodstack.app`
3. Click **Send** on client row (or use API)
4. Client receives email with login URL and instructions

Handoff email template is also copied to clipboard for manual sending.

## Subscription Management

Tier changes from Stripe update automatically via webhook. Manual overrides:

1. Open client details
2. Change **Tier** dropdown
3. Save — features update on next portal redeploy

## Customer Onboarding Checklist

- [ ] Client record created (automated or white-glove)
- [ ] Deployment status = `active`
- [ ] Branding configured (logo, colors)
- [ ] Owner added to team members
- [ ] Portal preview tested
- [ ] Handoff email sent
- [ ] Client confirmed first login
- [ ] Correct tier features verified

## API Reference (Admin)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/clients` | GET | List all clients |
| `/api/admin/clients` | POST | Create client |
| `/api/admin/clients/:id` | GET | Client details + activity |
| `/api/admin/clients/:id` | PUT | Update client |
| `/api/admin/clients/:id/activity` | GET | Activity log only |
| `/api/admin/send-handoff` | POST | Send portal ready email |

All admin endpoints require `Authorization: Bearer <ADMIN_API_SECRET>` or admin JWT.
