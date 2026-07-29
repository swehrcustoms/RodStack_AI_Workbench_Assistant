# RodStack Client Pilot Guide

**For:** Custom rod building shops testing RodStack as daily workshop software  
**App:** https://rod-stack-ai-workbench-assistant.vercel.app/

---

## 1. Getting started (onboarding)

1. Open the app link above on the computer or tablet you use at the bench.
2. Go to **Profile** (or open [Sign in](https://rod-stack-ai-workbench-assistant.vercel.app/#view=profile)).
3. Choose **Create Account**.
4. Enter builder name, shop name, email, and password.
5. Check your email and **confirm** the account if asked.
6. Sign in and open **Bench** / **Vault** / **Inventory** / **CRM** from the app navigation.

**Tip:** Bookmark the app URL on the shop tablet. Use Chrome or Safari for best results.

---

## 2. What works today (supported)

| Area | What you can do |
| ---- | ---------------- |
| **Builds** | Create and edit custom rod builds, stages, and notes |
| **Build sheets** | Document blank/setup details and export/print tooling in-app |
| **Inventory** | Track SKUs, quantities, low-stock warnings, CSV import/export |
| **CRM** | Customers, open orders, simple quotes |
| **Spine Finder** | Guided spine / flex marking workflow |
| **Cure Tracker** | Log epoxy coats and cure windows |
| **Photos** | Attach JPEG/PNG to a build **on this device** |
| **Cloud sync** | When signed in with internet, workshop data syncs to your account |
| **Offline-ish** | Local save continues if the network drops; sync retries when online |

---

## 3. Upcoming / not in this pilot

| Area | Status |
| ---- | ------ |
| Shopify order import | Not available yet |
| QuickBooks accounting sync | Not available yet |
| Self-serve Stripe billing portal | Not required for pilot |
| Ask Claude AI assistant | Owner/support tool only; may be off during pilot |
| Shared cloud photo library across devices | Not yet — photos stay on the device that captured them |
| Custom shop subdomain (`yourshop.rodstack.app`) | Not yet — everyone uses the main RodStack URL |

---

## 4. Important: photos stay on the device

RodStack stores build photos in **this browser’s local storage** (IndexedDB), not in the cloud yet.

That means:

- Photos on the shop iPad **do not automatically appear** on a different laptop.
- Clearing browser data can delete local photos.
- If storage is full, RodStack shows a warning instead of crashing — delete older photos or free space.

**Pilot recommendation:** Pick one primary bench device for photo logging, or export galleries periodically.

---

## 5. Daily workflow (suggested)

1. Sign in.
2. Open or create today’s build.
3. Update inventory if you pulled blanks/guides.
4. Use Spine Finder / Cure Tracker as needed.
5. Add stage photos on the bench tablet.
6. Update CRM customer / order status when the rod moves.
7. Sign out only on shared computers.

---

## 6. Multiple builders in one shop

By default, each new signup gets its **own** shop organization.

If a second builder needs access to the **same** shop:

1. Both users create accounts (or the second user creates an account).
2. Tell RodStack support your shop email and the second user’s email.
3. Support runs a secure add-to-organization step (copies a workshop snapshot onto the second account).

Until that is done, use **one shared shop login** for the pilot if you need a single shared inventory/build list.

---

## 7. Support

**During the pilot, contact:**

- Email: INSERT_SUPPORT_EMAIL_HERE  
- Phone / text: INSERT_SUPPORT_PHONE_HERE  
- Expected response: same business day when possible  

Please include:

- Your shop name  
- Login email  
- What screen you were on  
- Screenshot if something looks wrong  

**Do not share passwords** in email. Use password reset from the sign-in screen if locked out.

---

## 8. Admin / RodStack operator notes (not for the shop)

Operators use `/admin/login` after platform-owner promotion.

Add a second shop user:

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
npm run admin:add-user-to-org -- --email second@shop.com --org-id <shop-org-uuid>
```

Or SQL helper: `scripts/add-user-to-org.sql`

---

## 9. Quick links

| Link | URL |
| ---- | --- |
| App | https://rod-stack-ai-workbench-assistant.vercel.app/ |
| Sign in / profile | https://rod-stack-ai-workbench-assistant.vercel.app/#view=profile |
| Admin (RodStack staff only) | https://rod-stack-ai-workbench-assistant.vercel.app/admin/login |
