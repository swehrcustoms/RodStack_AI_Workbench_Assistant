const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "onboarding@rodstack.app";
const PORTAL_BASE = process.env.VITE_CLIENT_PORTAL_BASE_URL || "https://{slug}.rodstack.app";

function portalUrl(slug) {
  return PORTAL_BASE.replace("{slug}", slug);
}

function buildWelcomeHtml(slug) {
  const loginUrl = `${portalUrl(slug)}/login`;
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #1a4a7a;">Welcome to RodStack!</h1>
      <p>Your personal AI Workbench portal is being set up and will be ready shortly.</p>
      <p><strong>Portal URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p>We'll send another email when your portal is live.</p>
      <p style="font-size: 12px; color: #666;">Questions? Reply to this email or visit rodstack.app/support</p>
    </div>
  `;
}

function buildPortalReadyHtml(client) {
  const loginUrl = `${portalUrl(client.client_slug)}/login`;
  const name = client.owner_name || client.company_name;
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #1a4a7a;">Your RodStack Portal is Ready!</h1>
      <p>Hi ${name},</p>
      <p>Your RodStack AI Workbench is live and ready to use.</p>
      <p style="margin: 24px 0;">
        <a href="${loginUrl}" style="background: #1a4a7a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          Log In to Your Portal
        </a>
      </p>
      <p><strong>Portal URL:</strong> ${loginUrl}</p>
      <p>Sign in with <strong>${client.owner_email || client.company_email}</strong> to get started.</p>
      <p style="font-size: 12px; color: #666;">Plan: ${client.subscription_tier}</p>
    </div>
  `;
}

function buildHandoffText(client) {
  const loginUrl = `${portalUrl(client.client_slug)}/login`;
  const name = client.owner_name || "there";
  return `Hi ${name},

Your RodStack AI Workbench portal is ready!

Access it here: ${loginUrl}

You can log in with your email (${client.owner_email || client.company_email}) and create a password.

Welcome aboard!
— The RodStack Team`;
}

/**
 * Send email via SendGrid REST API (no SDK required for serverless).
 */
async function sendViaSendGrid({ to, subject, html, text }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[email] SENDGRID_API_KEY not set — skipping send to", to);
    return { skipped: true };
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: "RodStack" },
      subject,
      content: [
        { type: "text/plain", value: text || subject },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid error ${response.status}: ${body}`);
  }
  return { sent: true };
}

export async function sendWelcomeEmail(email, slug) {
  return sendViaSendGrid({
    to: email,
    subject: "Welcome to RodStack — Your Portal is Being Created",
    html: buildWelcomeHtml(slug),
    text: `Welcome to RodStack! Your portal will be at ${portalUrl(slug)}`,
  });
}

export async function sendPortalReadyEmail(client) {
  const to = client.owner_email || client.company_email;
  return sendViaSendGrid({
    to,
    subject: "Your RodStack AI Workbench is Ready!",
    html: buildPortalReadyHtml(client),
    text: buildHandoffText(client),
  });
}

export function getHandoffEmailTemplate(client) {
  return buildHandoffText(client);
}
