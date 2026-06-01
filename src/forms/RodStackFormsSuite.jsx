import { useState, useEffect } from "react";
import SignupForm from "./SignupForm.jsx";
import WelcomeEmailPreview from "./WelcomeEmailPreview.jsx";
import SupportForm from "./SupportForm.jsx";
import FeatureRequestForm from "./FeatureRequestForm.jsx";
import { Card, FormHeader, FormsStyles, T, font, mono } from "./formsUi.jsx";
import { getFormsStats } from "../data/formsStore.js";

const TABS = [
  {
    id: "signup",
    label: "User Signup",
    icon: "◎",
    color: T.accent,
    header: { icon: "◎", title: "Create your account", subtitle: "Join RodStack — free to start, no credit card required" },
  },
  {
    id: "email",
    label: "Welcome Email",
    icon: "✉",
    color: T.green,
    header: { icon: "✉", title: "Welcome email", subtitle: "Preview · Apps Script · Send test", color: T.green },
  },
  {
    id: "support",
    label: "Support Request",
    icon: "⊙",
    color: T.red,
    header: { icon: "⊙", title: "Support request", subtitle: "We typically respond within 24 hours", color: T.red },
  },
  {
    id: "feature",
    label: "Feature Request",
    icon: "◈",
    color: T.purple,
    header: { icon: "◈", title: "Request a feature", subtitle: "Help shape the future of RodStack", color: T.purple },
  },
];

export default function RodStackFormsSuite({
  initialTab = "signup",
  embedded = false,
  showHeader = true,
  onBack,
  signupInitialValues,
}) {
  const [active, setActive] = useState(initialTab);
  const [counts, setCounts] = useState(() => getFormsStats());

  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);

  const refreshCounts = () => setCounts(getFormsStats());
  const tab = TABS.find((t) => t.id === active) || TABS[0];

  const wrapperStyle = embedded
    ? { width: "100%", fontFamily: font }
    : { minHeight: "100vh", background: T.bg, fontFamily: font, padding: "20px 16px" };

  return (
    <div style={wrapperStyle} className="rs-forms">
      <FormsStyles />
      {showHeader && !embedded && (
        <div style={{ maxWidth: 760, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              RodStack <span style={{ color: T.muted }}>/ Forms Suite</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              Signups · Support · Features · Email — logged to database
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: font,
                }}
              >
                ← Back
              </button>
            )}
            <span className="rs-tag" style={{ background: T.greenDim, color: T.green, borderColor: `${T.green}33` }}>
              {counts.total} records
            </span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 760, margin: embedded ? "0" : "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "1px solid",
              borderColor: active === t.id ? `${t.color}44` : T.border,
              background: active === t.id ? `${t.color}14` : T.surface,
              color: active === t.id ? t.color : T.muted,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 760, margin: embedded ? "0 auto" : "0 auto" }}>
        <Card>
          <FormHeader {...tab.header} />
          {active === "signup" && (
            <SignupForm initialValues={signupInitialValues} onSuccess={() => refreshCounts()} />
          )}
          {active === "email" && <WelcomeEmailPreview />}
          {active === "support" && <SupportForm onSuccess={() => refreshCounts()} />}
          {active === "feature" && <FeatureRequestForm onSuccess={() => refreshCounts()} />}
        </Card>
      </div>
    </div>
  );
}
