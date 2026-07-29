import { createServiceClient } from "../_shared/admin.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type Json = Record<string, unknown>;

function mapStripeStatus(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

function mapPriceToTier(priceId: string | null | undefined, metadata: Json | null | undefined): string {
  const metaTier = String(metadata?.tier || metadata?.plan || "").toLowerCase();
  if (metaTier === "free" || metaTier === "pro" || metaTier === "enterprise") return metaTier;
  const pro = Deno.env.get("STRIPE_PRICE_PRO") || "";
  const enterprise = Deno.env.get("STRIPE_PRICE_ENTERPRISE") || "";
  if (priceId && enterprise && priceId === enterprise) return "enterprise";
  if (priceId && pro && priceId === pro) return "pro";
  if (!priceId) return "free";
  return "pro";
}

function unixToIso(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

function extractOrgId(metadata: Json | null | undefined): string | null {
  const id = metadata?.organization_id || metadata?.organizationId || metadata?.org_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v];
    })
  );
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${rawBody}`)
  );
  const digest = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // constant-time-ish compare
  if (digest.length !== v1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < digest.length; i++) mismatch |= digest.charCodeAt(i) ^ v1.charCodeAt(i);
  return mismatch === 0;
}

async function upsertSubscription(
  service: ReturnType<typeof createServiceClient>,
  input: {
    organizationId: string;
    tier: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripeProductId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    trialEnd: string | null;
    metadata: Json;
  }
) {
  const row = {
    organization_id: input.organizationId,
    tier: input.tier,
    status: input.status,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_price_id: input.stripePriceId,
    stripe_product_id: input.stripeProductId,
    current_period_start: input.currentPeriodStart,
    current_period_end: input.currentPeriodEnd,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    canceled_at: input.canceledAt,
    trial_end: input.trialEnd,
    metadata: input.metadata,
    updated_at: new Date().toISOString(),
  };

  const { error } = await service.from("subscriptions").upsert(row, {
    onConflict: "organization_id",
  });
  if (error) throw error;
  await service.rpc("refresh_org_entitlements", {
    org_id: input.organizationId,
    src: "subscription",
  });
}

async function applySubscriptionObject(
  service: ReturnType<typeof createServiceClient>,
  sub: Json,
  fallbackOrgId: string | null
) {
  const metadata = (sub.metadata as Json) || {};
  const organizationId = extractOrgId(metadata) || fallbackOrgId;
  if (!organizationId) {
    throw new Error("organization_id missing from Stripe subscription metadata");
  }

  const item = Array.isArray(sub.items)
    ? null
    : ((sub.items as Json)?.data as Json[] | undefined)?.[0];
  const price = (item?.price as Json) || {};
  const priceId = typeof price.id === "string" ? price.id : null;
  const productId = typeof price.product === "string" ? price.product : null;

  await upsertSubscription(service, {
    organizationId,
    tier: mapPriceToTier(priceId, { ...metadata, ...(price.metadata as Json) }),
    status: mapStripeStatus(String(sub.status || "")),
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : null,
    stripeSubscriptionId: typeof sub.id === "string" ? sub.id : null,
    stripePriceId: priceId,
    stripeProductId: productId,
    currentPeriodStart: unixToIso(sub.current_period_start as number),
    currentPeriodEnd: unixToIso(sub.current_period_end as number),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    canceledAt: unixToIso(sub.canceled_at as number),
    trialEnd: unixToIso(sub.trial_end as number),
    metadata,
  });

  return organizationId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return jsonResponse({ error: "STRIPE_WEBHOOK_SECRET not configured" }, 503);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const valid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    return jsonResponse({ error: "Invalid Stripe signature" }, 400);
  }

  let event: Json;
  try {
    event = JSON.parse(rawBody) as Json;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const eventId = String(event.id || "");
  const eventType = String(event.type || "");
  if (!eventId || !eventType) {
    return jsonResponse({ error: "Malformed Stripe event" }, 400);
  }

  const service = createServiceClient();

  const { data: existing } = await service.from("stripe_events").select("id").eq("id", eventId).maybeSingle();
  if (existing) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  try {
    const dataObject = (event.data as Json)?.object as Json;
    let organizationId: string | null = null;

    switch (eventType) {
      case "checkout.session.completed": {
        organizationId = extractOrgId((dataObject.metadata as Json) || {});
        const subscriptionId =
          typeof dataObject.subscription === "string" ? dataObject.subscription : null;
        const customerId = typeof dataObject.customer === "string" ? dataObject.customer : null;
        if (organizationId && customerId) {
          await service.from("subscriptions").upsert(
            {
              organization_id: organizationId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: "active",
              tier: "pro",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "organization_id" }
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        organizationId = await applySubscriptionObject(service, dataObject, null);
        break;
      }
      case "customer.subscription.deleted": {
        organizationId = await applySubscriptionObject(service, {
          ...dataObject,
          status: "canceled",
        }, null);
        break;
      }
      case "invoice.paid": {
        const subId =
          typeof dataObject.subscription === "string" ? dataObject.subscription : null;
        if (subId) {
          const { data: row } = await service
            .from("subscriptions")
            .select("organization_id")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();
          if (row?.organization_id) {
            organizationId = row.organization_id;
            await service
              .from("subscriptions")
              .update({ status: "active", updated_at: new Date().toISOString() })
              .eq("organization_id", organizationId);
            await service.rpc("refresh_org_entitlements", {
              org_id: organizationId,
              src: "subscription",
            });
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const subId =
          typeof dataObject.subscription === "string" ? dataObject.subscription : null;
        if (subId) {
          const { data: row } = await service
            .from("subscriptions")
            .select("organization_id")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();
          if (row?.organization_id) {
            organizationId = row.organization_id;
            await service
              .from("subscriptions")
              .update({ status: "past_due", updated_at: new Date().toISOString() })
              .eq("organization_id", organizationId);
            await service.rpc("refresh_org_entitlements", {
              org_id: organizationId,
              src: "subscription",
            });
          }
        }
        break;
      }
      default:
        // Acknowledge unhandled events without error to avoid Stripe retries
        break;
    }

    await service.from("stripe_events").insert({
      id: eventId,
      type: eventType,
      livemode: Boolean(event.livemode),
      organization_id: organizationId,
      payload: { id: eventId, type: eventType },
    });

    await service.from("audit_logs").insert({
      actor_id: null,
      action: "stripe.webhook",
      resource_type: "stripe_event",
      resource_id: eventId,
      organization_id: organizationId,
      metadata: { type: eventType },
    });

    return jsonResponse({ ok: true, type: eventType, organizationId });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("stripe-webhook failed", eventType, message);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});
