import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { submitContactInquiry } from "@/landing/lib/submitContact";

const PLUM = "#3a0a1f";
const CYAN = "#22d3ee";

export function openDemoDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mediease:open-demo"));
  }
}

const EMPTY_DEMO_FORM = { name: "", email: "", phone: "", org: "" };

export function DemoDrawer() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_DEMO_FORM);

  useEffect(() => {
    const handler = () => {
      setSubmitted(false);
      setSubmitError(null);
      setForm(EMPTY_DEMO_FORM);
      setOpen(true);
    };
    window.addEventListener("mediease:open-demo", handler);
    return () => window.removeEventListener("mediease:open-demo", handler);
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
    try {
      await submitContactInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: `Demo request from ${form.org.trim()}. Organization: ${form.org.trim()}`,
        providerName: form.org.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Book a demo"
        className={`fixed right-0 top-0 z-[100] flex h-full w-full max-w-md flex-col text-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#0b1220" }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-7 py-6">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Book a personalised demo
            </h2>
            <p className="mt-1.5 text-sm text-white/60">
              Quick details — we'll set up a 20-minute walkthrough.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: CYAN }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PLUM} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-semibold">You're on the list</h3>
              <p className="mt-2 max-w-xs text-sm text-white/65">
                Our team will reach out within one business day to schedule your personalized demo.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {submitError && (
                <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {submitError}
                </p>
              )}
              <Field label="Full Name" required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Type your answer here..."
                  className={inputCls}
                />
              </Field>

              <Field label="Business Email" required>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Phone Number" required>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm font-semibold">
                    <span className="text-xs text-white/60">IN</span>
                    <span>+91</span>
                  </div>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="081234 56789"
                    className={`${inputCls} flex-1`}
                  />
                </div>
              </Field>

              <Field label="Organization Name" required>
                <input
                  required
                  value={form.org}
                  onChange={(e) => setForm({ ...form, org: e.target.value })}
                  placeholder="Your clinic or hospital name"
                  className={inputCls}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: CYAN, color: "#062731" }}
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>

              <p className="text-center text-xs text-white/45">
                By submitting this form, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-colors";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white">
        {label} {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}
