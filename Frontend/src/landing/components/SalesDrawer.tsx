import { useEffect, useState } from "react";
import { X, Building2, Phone, Mail, User, Users, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { submitContactInquiry } from "@/landing/lib/submitContact";

const PLUM_DEEP = "#2a0a18";
const PLUM_INK = "#3a0a1f";
const CREAM = "#faf7f2";
const BUTTER = "#f5e58a";

type SalesContext = {
  intent?: "enterprise" | "volume";
  tierConsults?: number;
  tierRate?: number;
};

export function openSalesDrawer(context: SalesContext = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mediease:open-sales", { detail: context }));
  }
}

const SIZES = [
  "1–5 doctors",
  "6–20 doctors",
  "21–50 doctors",
  "50+ doctors / hospital network",
];

const TIMELINES = [
  "Exploring — no rush",
  "Within 1 month",
  "Within 3 months",
  "Already evaluating vendors",
];

const EMPTY_SALES_FORM = {
  name: "",
  email: "",
  phone: "",
  org: "",
  size: "",
  timeline: "",
  notes: "",
};

export function SalesDrawer() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<SalesContext>({});
  const [form, setForm] = useState(EMPTY_SALES_FORM);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SalesContext>).detail || {};
      setCtx(detail);
      setSubmitted(false);
      setSubmitError(null);
      setForm(EMPTY_SALES_FORM);
      setOpen(true);
    };
    window.addEventListener("mediease:open-sales", handler as EventListener);
    return () => window.removeEventListener("mediease:open-sales", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const volumeLine =
      ctx.intent === "volume" && ctx.tierConsults && ctx.tierRate
        ? `Volume tier: ~${ctx.tierConsults.toLocaleString("en-IN")} consults/month at ₹${ctx.tierRate.toFixed(2)} per consult.\n`
        : "";

    const message = [
      `Sales inquiry (${ctx.intent ?? "general"}).`,
      volumeLine,
      `Organization: ${form.org.trim()}`,
      `Practice size: ${form.size}`,
      `Timeline: ${form.timeline}`,
      form.notes.trim() ? `Notes: ${form.notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await submitContactInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message,
        providerName: form.org.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    ctx.intent === "volume"
      ? "Lock in your volume rate"
      : ctx.intent === "enterprise"
      ? "Talk to our enterprise team"
      : "Talk to sales";

  const sub =
    ctx.intent === "volume" && ctx.tierConsults && ctx.tierRate
      ? `You're looking at ~${ctx.tierConsults.toLocaleString("en-IN")} consults / month at ₹${ctx.tierRate.toFixed(2)} per consult. Share a few details and we'll send a tailored agreement within 1 business day.`
      : "Tell us about your practice and a member of our team will reach out within 1 business day with pricing tailored to your network.";

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Talk to sales"
        className={`fixed right-0 top-0 z-[100] flex h-full w-full max-w-md flex-col shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: CREAM, color: PLUM_INK }}
      >
        <div
          className="relative overflow-hidden px-7 pt-7 pb-8"
          style={{ background: PLUM_DEEP, color: "#fff" }}
        >
          <div
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
            style={{ background: BUTTER }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: "#ffffff15", color: BUTTER }}
              >
                <Sparkles className="h-3 w-3" />{" "}
                {ctx.intent === "volume" ? "Volume agreement" : "Sales"}
              </span>
              <h2 className="mt-3 font-display text-2xl tracking-tight">{heading}</h2>
              <p className="mt-2 text-sm" style={{ color: "#ffffffB3" }}>
                {sub}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: BUTTER }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PLUM_DEEP} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-display text-2xl" style={{ color: PLUM_DEEP }}>
                We'll be in touch
              </h3>
              <p className="mt-2 max-w-xs text-sm" style={{ color: `${PLUM_INK}B3` }}>
                A member of the MediEase team will email you within 1 business day with a tailored proposal.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: PLUM_DEEP, color: "#fff" }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {submitError && (
                <p
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "#c11", background: "#fff0f0", color: "#8b0000" }}
                >
                  {submitError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <IconField icon={<User className="h-4 w-4" />} label="Full name" required>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Dr. Anita Rao"
                    className={inputCls}
                  />
                </IconField>
                <IconField icon={<Building2 className="h-4 w-4" />} label="Organization" required>
                  <input
                    required
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                    placeholder="Apollo Clinics"
                    className={inputCls}
                  />
                </IconField>
              </div>

              <IconField icon={<Mail className="h-4 w-4" />} label="Work email" required>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="anita@clinic.com"
                  className={inputCls}
                />
              </IconField>

              <IconField icon={<Phone className="h-4 w-4" />} label="Phone" required>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98xxxxxxxx"
                  className={inputCls}
                />
              </IconField>

              <IconField icon={<Users className="h-4 w-4" />} label="Practice size" required>
                <select
                  required
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  <option value="" disabled>Select size</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </IconField>

              <IconField icon={<Calendar className="h-4 w-4" />} label="Timeline" required>
                <select
                  required
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  <option value="" disabled>When are you looking to start?</option>
                  {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </IconField>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: `${PLUM_INK}99` }}>
                  Anything specific?
                </span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="HIS integrations, multi-site rollout, security review…"
                  className={`${inputCls} resize-none`}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl px-5 py-3.5 text-base font-semibold shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: PLUM_DEEP, color: "#fff" }}
              >
                {submitting
                  ? "Submitting…"
                  : ctx.intent === "volume"
                  ? "Request my volume rate"
                  : "Request a call back"}
              </button>

              <div className="flex items-center justify-center gap-2 pt-1 text-[11px]" style={{ color: `${PLUM_INK}80` }}>
                <ShieldCheck className="h-3.5 w-3.5" /> Your details stay private — no spam, ever.
              </div>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}

const inputCls =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm placeholder:text-[#3a0a1f]/40 focus:outline-none focus:ring-2 transition-colors";

function IconField({
  icon,
  label,
  required,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: `${PLUM_INK}99` }}>
        <span style={{ color: PLUM_DEEP }}>{icon}</span>
        {label} {required && <span style={{ color: "#c11" }}>*</span>}
      </span>
      <div className="[&_input]:border-[#3a0a1f1a] [&_select]:border-[#3a0a1f1a] [&_textarea]:border-[#3a0a1f1a] [&_input:focus]:border-[#3a0a1f60] [&_select:focus]:border-[#3a0a1f60] [&_textarea:focus]:border-[#3a0a1f60]">
        {children}
      </div>
    </label>
  );
}
