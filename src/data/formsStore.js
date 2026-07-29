import { getClientEnv } from "../lib/env";

export const SHEETS = {
  signup: "17Xdqage1lBLZCfx8LC6m03n5w9fhf9IL_qcLgZRqTsM",
  support: "1m8jG_3mva_CowBPQIzU4mQ8Upn4ADGZabPBmIoDzods",
  feature: "1LEuolm3ZoGG3JOs9EEtOxbx4CCK8xVs6Pju8gB7GBzs",
  users: "1WRA19FBOlJ5idoQ9lVJL6miQJy2Sc5Uxvq0UuvfWt_A",
};

export const FORMS_STORAGE_KEY = "rodstack.forms.records.v1";
export const USERS_STORAGE_KEY = "rodstack.admin.users.v1";

const PLAN_PRICES = { free: "0.00", pro: "29.00", enterprise: "99.00" };

function today() {
  return new Date().toISOString().split("T")[0];
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function loadFormsStore() {
  try {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { signups: [], support: [], features: [], emailLogs: [], submissions: [] };
}

export function saveFormsStore(store) {
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(store));
}

function appendSubmission(store, type, payload) {
  const entry = {
    id: uid("SUB"),
    type,
    timestamp: new Date().toISOString(),
    payload,
  };
  store.submissions = [entry, ...(store.submissions || [])].slice(0, 500);
  return entry;
}

function upsertUserFromSignup(signup) {
  const users = loadUsers();
  const maxId = users.reduce((m, u) => {
    const n = parseInt((u.id || "U-000000").split("-")[1], 10);
    return n > m ? n : m;
  }, 0);
  const exists = users.find((u) => u.email?.toLowerCase() === signup.email?.toLowerCase());
  if (exists) {
    const updated = users.map((u) =>
      u.email?.toLowerCase() === signup.email?.toLowerCase()
        ? {
            ...u,
            name: signup.full_name || signup.name || u.name,
            phone: signup.phone || u.phone,
            company: signup.company || u.company,
            role: signup.job_title || signup.role || u.role,
            subscription_level: signup.subscription_plan || signup.plan || u.subscription_level,
            subscription_price: PLAN_PRICES[signup.subscription_plan || signup.plan] || u.subscription_price,
            status: "active",
            notes: [u.notes, `Signup refresh ${today()}`].filter(Boolean).join(" · "),
            updated_at: today(),
            tags: [u.tags, "signup-form"].filter(Boolean).join(";"),
          }
        : u
    );
    saveUsers(updated);
    return updated.find((u) => u.email?.toLowerCase() === signup.email?.toLowerCase());
  }
  const newUser = {
    id: `U-${String(maxId + 1).padStart(6, "0")}`,
    name: signup.full_name || signup.name,
    email: signup.email,
    phone: signup.phone || "",
    company: signup.company || "",
    role: signup.job_title || signup.role || "",
    signup_date: today(),
    status: "pending",
    subscription_level: signup.subscription_plan || signup.plan || "free",
    subscription_price: PLAN_PRICES[signup.subscription_plan || signup.plan] || "0.00",
    notes: signup.referral_source ? `Referral: ${signup.referral_source}` : "",
    tags: "signup-form",
    created_at: today(),
    updated_at: today(),
  };
  saveUsers([newUser, ...users]);
  return newUser;
}

export async function postToEndpoint(payload) {
  const { formsWebhookUrl } = getClientEnv();
  if (!formsWebhookUrl) return { ok: true, simulated: true };
  const res = await fetch(formsWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Webhook failed (${res.status})`);
  return { ok: true, simulated: false };
}

export async function submitSignup(formData) {
  const payload = {
    sheet_id: SHEETS.signup,
    record_type: "signup",
    timestamp: new Date().toISOString(),
    full_name: formData.name,
    email: formData.email,
    phone: formData.phone || "",
    company: formData.company || "",
    job_title: formData.role || "",
    subscription_plan: formData.plan || "free",
    referral_source: formData.referral || "",
    agreed_to_terms: !!formData.terms,
  };

  await postToEndpoint(payload).catch(() => null);

  const store = loadFormsStore();
  const record = { id: uid("SIG"), ...payload, linked_user_id: null };
  const user = upsertUserFromSignup({ ...payload, name: payload.full_name, plan: payload.subscription_plan });
  record.linked_user_id = user?.id;
  store.signups = [record, ...(store.signups || [])];
  appendSubmission(store, "signup", record);
  saveFormsStore(store);
  return { record, user };
}

export async function submitSupport(formData, ticketId) {
  const payload = {
    sheet_id: SHEETS.support,
    record_type: "support",
    ticket_id: ticketId,
    timestamp: new Date().toISOString(),
    full_name: formData.name,
    email: formData.email,
    subject: formData.subject,
    category: formData.category,
    priority: formData.priority,
    description: formData.description,
    steps: formData.steps || "",
    device: formData.device || "",
    attachment: formData.attachment || "",
    status: "open",
  };

  await postToEndpoint(payload).catch(() => null);

  const store = loadFormsStore();
  const record = { id: uid("SUP"), ...payload };
  store.support = [record, ...(store.support || [])];
  appendSubmission(store, "support", record);
  saveFormsStore(store);
  return record;
}

export async function submitFeatureRequest(formData) {
  const payload = {
    sheet_id: SHEETS.feature,
    record_type: "feature",
    timestamp: new Date().toISOString(),
    full_name: formData.name,
    email: formData.email,
    feature_title: formData.title,
    problem_it_solves: formData.problem,
    description: formData.description,
    use_case: formData.usecase || "",
    priority: formData.priority,
    current_workaround: formData.workaround || "",
    status: "review",
  };

  await postToEndpoint(payload).catch(() => null);

  const store = loadFormsStore();
  const record = { id: uid("FEA"), ...payload };
  store.features = [record, ...(store.features || [])];
  appendSubmission(store, "feature", record);
  saveFormsStore(store);
  return record;
}

export async function logWelcomeEmail({ name, email, plan }) {
  const payload = {
    sheet_id: SHEETS.users,
    record_type: "welcome_email",
    timestamp: new Date().toISOString(),
    recipient_name: name,
    recipient_email: email,
    subscription_level: plan,
    subscription_price: PLAN_PRICES[plan] || "0.00",
  };

  await postToEndpoint(payload).catch(() => null);

  const store = loadFormsStore();
  const record = { id: uid("EML"), ...payload };
  store.emailLogs = [record, ...(store.emailLogs || [])];
  appendSubmission(store, "email", record);
  saveFormsStore(store);
  return record;
}

export function getFormsStats() {
  const store = loadFormsStore();
  return {
    signups: store.signups?.length || 0,
    support: store.support?.length || 0,
    features: store.features?.length || 0,
    emails: store.emailLogs?.length || 0,
    total: store.submissions?.length || 0,
    store,
  };
}
