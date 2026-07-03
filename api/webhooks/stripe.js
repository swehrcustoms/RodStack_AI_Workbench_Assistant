import Stripe from "stripe";
import { getSupabaseAdmin } from "../../src/lib/supabaseAdmin.js";
import { generateUniqueSlug } from "../../src/lib/slug.js";
import { getPriceToTier } from "../../src/lib/stripe.js";
import { queueDeploymentJob } from "../../src/lib/deployment.js";
import { sendWelcomeEmail } from "../../src/lib/email.js";
import { logActivity } from "../../src/lib/activity.js";
import { readRawBody } from "../../src/middleware/tenantContext.js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured");
  return new Stripe(key);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await readRawBody(req);
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object);
        break;
      default:
        console.log(`[stripe] Unhandled event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("[stripe] Webhook handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutComplete(session) {
  const supabase = getSupabaseAdmin();
  const stripe = getStripe();

  const customer = await stripe.customers.retrieve(session.customer);
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = getPriceToTier(priceId);

  const name = customer.name || customer.email?.split("@")[0] || "client";
  const slug = await generateUniqueSlug(name, supabase);

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      client_slug: slug,
      company_name: customer.description || customer.name || slug,
      company_email: customer.email,
      subscription_tier: tier,
      subscription_status: "active",
      subscription_id: subscription.id,
      customer_id: customer.id,
      owner_email: customer.email,
      owner_name: customer.name,
      is_white_glove: false,
      deployment_status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }

  await supabase.from("client_team_members").insert({
    client_id: client.id,
    user_email: customer.email,
    role: "admin",
  });

  await logActivity(client.id, "client_created", "stripe", { tier, slug, source: "checkout" });

  await queueDeploymentJob(client.id, slug, tier);
  await sendWelcomeEmail(customer.email, slug);
}

async function handleSubscriptionUpdate(subscription) {
  const supabase = getSupabaseAdmin();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("subscription_id", subscription.id)
    .single();

  if (!client) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const newTier = getPriceToTier(priceId);
  const oldTier = client.subscription_tier;

  await supabase
    .from("clients")
    .update({
      subscription_tier: newTier,
      subscription_status: subscription.status === "active" ? "active" : subscription.status,
    })
    .eq("id", client.id);

  await logActivity(client.id, "subscription_updated", "stripe", {
    old_tier: oldTier,
    new_tier: newTier,
    status: subscription.status,
  });
}

async function handleSubscriptionCancelled(subscription) {
  const supabase = getSupabaseAdmin();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("subscription_id", subscription.id)
    .single();

  if (!client) return;

  await supabase
    .from("clients")
    .update({ subscription_status: "cancelled" })
    .eq("id", client.id);

  await logActivity(client.id, "subscription_cancelled", "stripe", {});
}
