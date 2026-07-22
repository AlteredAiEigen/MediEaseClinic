import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  User,
  Building2,
  MailCheck,
} from "lucide-react";
import { ASSETS } from "@/landing/assets/assets";

const PLUM = "#2a0a18";
const PLUM_SOFT = "#3d1426";
const CREAM = "#f6efe3";
const BUTTER = "#e8d57a";
const TEAL = "#3aa8a0";

export function SignupPage() {
  const [step, setStep] = useState<"form" | "sent">("form");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    clinic: "",
    email: "",
    password: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setStep("sent");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: CREAM }}>
      {/* Left brand panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ background: PLUM, color: CREAM }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(60% 50% at 20% 10%, ${PLUM_SOFT} 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, ${TEAL}33 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <img src={ASSETS.logo} alt="MediEase" className="h-9 w-auto" />
        </div>
        <div className="relative z-10">
          <h1
            className="mt-5 text-5xl leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            One calm workspace for your whole clinic.
          </h1>
          <p className="mt-5 max-w-md text-sm" style={{ color: "#ffffffB3" }}>
            Create your admin account, invite your doctors and reception team, and bill only for the consultations you run — ₹20 each.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Pay-as-you-go: ₹20 per 15–20 min consult",
              "Invite doctors & reception under one admin",
              "Auto summaries, e-prescriptions, patient chat",
              "HIPAA & NHA aligned · hosted on AWS",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: BUTTER, color: PLUM }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 text-xs" style={{ color: "#ffffff80" }}>
          © {new Date().getFullYear()} MediEase · Built with clinicians, for clinicians
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <img src={ASSETS.logo} alt="MediEase" className="h-8 w-auto" />
          </div>

          {step === "form" ? (
            <>
              <h2 className="text-3xl tracking-tight" style={{ color: PLUM, fontFamily: "'Instrument Serif', serif" }}>
                Create your admin account
              </h2>
              <p className="mt-2 text-sm" style={{ color: `${PLUM}99` }}>
                You'll start on Pay-as-you-go — ₹20 per consultation (15–20 min). No card required to sign up.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <Field
                  icon={<User className="h-4 w-4" />}
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => setForm({ ...form, fullName: v })}
                  placeholder="Dr. Asha Verma"
                  required
                />
                <Field
                  icon={<Building2 className="h-4 w-4" />}
                  label="Clinic or hospital name"
                  value={form.clinic}
                  onChange={(v) => setForm({ ...form, clinic: v })}
                  placeholder="Verma Family Clinic"
                />
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Work email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="asha@clinic.com"
                  required
                />
                <div>
                  <label className="text-xs font-medium" style={{ color: PLUM }}>
                    Password
                  </label>
                  <div
                    className="mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5 bg-white"
                    style={{ border: `1px solid ${PLUM}20` }}
                  >
                    <Lock className="h-4 w-4" style={{ color: `${PLUM}80` }} />
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: PLUM }}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="text-xs"
                      style={{ color: `${PLUM}80` }}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ background: PLUM, color: "#fff" }}
                >
                  Create account & send confirmation
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs" style={{ color: `${PLUM}80` }}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  256-bit encryption · HIPAA-aligned
                </div>

                <p className="text-center text-xs" style={{ color: `${PLUM}99` }}>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold underline" style={{ color: PLUM }}>
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <ConfirmSent email={form.email} onBack={() => setStep("form")} />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium" style={{ color: PLUM }}>
        {label}
      </label>
      <div
        className="mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5 bg-white"
        style={{ border: `1px solid ${PLUM}20` }}
      >
        <span style={{ color: `${PLUM}80` }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: PLUM }}
        />
      </div>
    </div>
  );
}

function ConfirmSent({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: BUTTER, color: PLUM }}
      >
        <MailCheck className="h-8 w-8" strokeWidth={2.2} />
      </div>
      <h2
        className="mt-6 text-3xl tracking-tight"
        style={{ color: PLUM, fontFamily: "'Instrument Serif', serif" }}
      >
        Confirm your email
      </h2>
      <p className="mt-3 text-sm" style={{ color: `${PLUM}99` }}>
        We've sent a confirmation link to
      </p>
      <p className="mt-1 text-sm font-semibold break-all" style={{ color: PLUM }}>
        {email}
      </p>
      <p className="mt-4 text-sm" style={{ color: `${PLUM}99` }}>
        Click the link in that email to verify your admin account. Then you can invite doctors and reception, and start consulting at ₹20 each.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 text-left">
        <Step n={1} title="Open your inbox" desc="Look for an email from MediEase. Check spam if you don't see it." />
        <Step n={2} title="Click 'Verify email'" desc="That activates your admin login and clinic workspace." />
        <Step n={3} title="Invite your team" desc="Add doctors and receptionists from the admin dashboard." />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          style={{ background: PLUM, color: "#fff" }}
        >
          Go to sign in <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={onBack}
          className="text-xs underline"
          style={{ color: `${PLUM}99` }}
        >
          Used the wrong email? Go back
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: `${PLUM}80` }}>
        <Stethoscope className="h-3.5 w-3.5" />
        Welcome to a calmer clinic day.
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4 bg-white"
      style={{ border: `1px solid ${PLUM}15` }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ background: PLUM, color: BUTTER }}
      >
        {n}
      </span>
      <div>
        <div className="text-sm font-semibold" style={{ color: PLUM }}>
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: `${PLUM}99` }}>
          {desc}
        </div>
      </div>
    </div>
  );
}