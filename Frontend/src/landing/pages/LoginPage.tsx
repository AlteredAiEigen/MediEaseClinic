import type * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { ASSETS } from "@/landing/assets/assets";
import { useAuth } from "@/context/auth-context";
import {
  Shield,
  Stethoscope,
  ClipboardList,
  ArrowRight,
  Eye,
  EyeOff,
  Quote,
  Lock,
  Activity,
  Sparkles,
} from "lucide-react";

type RoleId = "admin" | "doctor" | "receptionist";

const PLUM = "#2a0a18";
const PLUM_SOFT = "#3d1426";
const CREAM = "#f6efe3";
const BUTTER = "#e8d57a";

const ROLES = [
  {
    id: "admin" as RoleId,
    title: "Admin",
    blurb: "Operate the clinic. Oversee staff, billing, audits, and access.",
    accent: "#7c3aed",
    ring: "rgba(124,58,237,0.35)",
    icon: Shield,
  },
  {
    id: "doctor" as RoleId,
    title: "Doctor",
    blurb: "Consult with calm. Notes, prescriptions, and history in one view.",
    accent: "#0ea5a4",
    ring: "rgba(14,165,164,0.35)",
    icon: Stethoscope,
  },
  {
    id: "receptionist" as RoleId,
    title: "Receptionist",
    blurb: "Run the front desk. Register, queue, and schedule with ease.",
    accent: "#d97706",
    ring: "rgba(217,119,6,0.35)",
    icon: ClipboardList,
  },
];

const TRUST = [
  { icon: Lock, label: "HIPAA aligned" },
  { icon: Shield, label: "NHA ready" },
  { icon: Activity, label: "99.99% uptime" },
  { icon: Sparkles, label: "Built for India" },
];

const IN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Jammu & Kashmir", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Puducherry", "Ladakh",
];

const ROLE_PATHS: Record<string, string> = {
  admin: "/admin-dashboard",
  doctor: "/doctor-dashboard",
  receptionist: "/receptionist-dashboard",
};

const emptySignup = {
  fullName: "",
  email: "",
  clinicName: "",
  clinicPhone: "",
  clinicEmail: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  website: "",
  registrationNumber: "",
  password: "",
  confirmPassword: "",
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, logout } = useAuth();

  const [role, setRole] = useState<RoleId>("doctor");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [signup, setSignup] = useState(emptySignup);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const selected = ROLES.find((r) => r.id === role) ?? ROLES[0];
  const isAdmin = selected.id === "admin";
  const activeMode = isAdmin ? mode : "login";

  const handleRoleChange = (nextRole: RoleId) => {
    setRole(nextRole);
    setError(null);
    setSignupSuccess(null);
    if (nextRole !== "admin") setMode("login");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSignupSuccess(null);
    try {
      const user = await login({ email, password });
      if (user.role !== role) {
        logout();
        setError(
          `This account is registered as ${user.role}. Please select the ${user.role} tab to sign in.`
        );
        return;
      }
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || ROLE_PATHS[user.role] || "/doctor-dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSignupSuccess(null);

    if (signup.password !== signup.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const { firstName, lastName } = splitName(signup.fullName);
    if (!firstName || !signup.email || !signup.clinicName || !signup.clinicPhone || !signup.address || !signup.city || !signup.state || !signup.pincode) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const user = await register({
        email: signup.email.trim(),
        password: signup.password,
        firstName,
        lastName,
        role: "admin",
        clinicName: signup.clinicName.trim(),
        clinicPhone: signup.clinicPhone.trim(),
        clinicEmail: signup.clinicEmail.trim() || undefined,
        clinicAddress: signup.address.trim(),
        clinicCity: signup.city.trim(),
        clinicState: signup.state,
        clinicPincode: signup.pincode.trim(),
        clinicCountry: signup.country.trim() || "India",
        clinicWebsite: signup.website.trim() || undefined,
        clinicRegistrationNumber: signup.registrationNumber.trim() || undefined,
      });

      if (user.role === "admin" && !user.isActive) {
        setSignupSuccess(
          "Account created! Check your email for a verification link before signing in."
        );
        setMode("login");
        setSignup(emptySignup);
        return;
      }

      navigate(ROLE_PATHS.admin, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden" style={{ background: CREAM, color: PLUM }}>
      <div className="mx-auto grid h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <aside
          className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between"
          style={{
            background: `radial-gradient(900px 600px at 15% 10%, ${PLUM_SOFT} 0%, transparent 60%), radial-gradient(700px 500px at 90% 100%, #4a1830 0%, transparent 55%), linear-gradient(160deg, ${PLUM} 0%, #1a0610 100%)`,
          }}
        >
          <svg aria-hidden viewBox="0 0 600 600" className="pointer-events-none absolute -right-20 -top-20 h-[520px] w-[520px] opacity-30">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor={BUTTER} stopOpacity="0.7" />
                <stop offset="100%" stopColor={BUTTER} stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="300" cy="300" r="260" fill="none" stroke="url(#g1)" strokeWidth="1.2" />
            <circle cx="300" cy="300" r="200" fill="none" stroke="url(#g1)" strokeWidth="1.2" />
            <circle cx="300" cy="300" r="140" fill="none" stroke="url(#g1)" strokeWidth="1.2" />
          </svg>
          <div className="relative z-10 flex items-center gap-3 px-12 pt-10">
            <Link to="/" className="flex items-center gap-3">
              <img src={ASSETS.logo} alt="MediEase" className="h-11 w-11" />
              <span className="font-display text-2xl font-semibold tracking-tight text-white">MediEase</span>
            </Link>
          </div>
          <div className="relative z-10 px-12 pb-4">
            <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-white">
              Step into a calmer, <br />
              <span className="italic" style={{ color: BUTTER }}>
                connected
              </span>{" "}
              clinic day.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
              Consultations, prescriptions, and the front desk — together in one warm, quiet workspace built with clinicians.
            </p>
            <figure
              className="mt-10 max-w-md rounded-2xl border p-6"
              style={{ borderColor: "rgba(246,239,227,0.12)", background: "rgba(246,239,227,0.04)", backdropFilter: "blur(6px)" }}
            >
              <Quote className="h-5 w-5" style={{ color: BUTTER }} />
              <blockquote className="mt-3 text-[15px] leading-relaxed text-white/85">
                We're building MediEase so every clinic — big or small — can care without the chaos of paperwork and fragmented systems.
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold" style={{ background: BUTTER, color: PLUM }}>
                  MK
                </div>
                <div className="text-sm">
                  <div className="font-medium text-white">MediEase Team</div>
                  <div className="text-white/55">Designing calmer clinic days</div>
                </div>
              </figcaption>
            </figure>
            <div className="mt-10 grid grid-cols-2 gap-3 pr-6">
              {TRUST.map((t) => {
                const Ic = t.icon;
                return (
                  <div
                    key={t.label}
                    className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5"
                    style={{ borderColor: "rgba(246,239,227,0.1)", background: "rgba(246,239,227,0.03)" }}
                  >
                    <Ic className="h-4 w-4" style={{ color: BUTTER }} strokeWidth={2} />
                    <span className="text-[12.5px] font-medium text-white/85">{t.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative z-10 px-12 pb-8 text-[12px] text-white/45">
            © {new Date().getFullYear()} MediEase · All rights reserved
          </div>
        </aside>

        <section className="relative flex h-screen flex-col overflow-y-auto px-6 py-10 sm:px-12 lg:px-16 lg:py-14">
          <header className="mb-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={ASSETS.logo} alt="MediEase" className="h-9 w-9" />
              <span className="font-display text-lg font-semibold">MediEase</span>
            </Link>
            <Link to="/" className="ml-auto text-sm font-medium opacity-60 transition-opacity hover:opacity-100">
              ← Back to site
            </Link>
          </header>

          <div className="mx-auto w-full max-w-[520px]">
            <h2 className="font-display text-[34px] font-semibold leading-tight tracking-tight">
              {activeMode === "signup" ? "Create your admin account" : "Sign in to MediEase"}
            </h2>
            <p className="mt-2 text-[14.5px] opacity-65">
              {activeMode === "signup"
                ? "Set up your clinic and your admin login in a few quick steps."
                : "Choose your role, then enter your credentials."}
            </p>

            <div
              className="mt-7 grid grid-cols-3 gap-1.5 rounded-2xl border p-1.5"
              style={{ borderColor: "rgba(42,10,24,0.1)", background: "white" }}
            >
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = r.id === selected.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id)}
                    className="group relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[12.5px] font-semibold transition-all"
                    style={{
                      background: active ? r.accent : "transparent",
                      color: active ? "white" : PLUM,
                      boxShadow: active ? `0 10px 24px -12px ${r.ring}` : undefined,
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                    {r.title}
                  </button>
                );
              })}
            </div>

            <div
              className="mt-4 flex items-start gap-3 rounded-xl border p-3.5"
              style={{ borderColor: "rgba(42,10,24,0.08)", background: "white" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${selected.accent}14`, color: selected.accent }}
              >
                <selected.icon className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <div className="text-[13px] leading-relaxed opacity-75">{selected.blurb}</div>
            </div>

            {isAdmin && (
              <div
                className="mt-5 grid grid-cols-2 gap-1 rounded-xl border p-1"
                style={{ borderColor: "rgba(42,10,24,0.1)", background: "white" }}
              >
                {(["login", "signup"] as const).map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setError(null);
                        setSignupSuccess(null);
                      }}
                      className="rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all"
                      style={{
                        background: active ? selected.accent : "transparent",
                        color: active ? "white" : PLUM,
                        boxShadow: active ? `0 8px 20px -12px ${selected.ring}` : undefined,
                      }}
                    >
                      {m === "login" ? "Login" : "Sign Up"}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            )}
            {signupSuccess && (
              <div className="mt-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13px] text-green-800">
                {signupSuccess}
              </div>
            )}

            {activeMode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Work email</span>
                  <input
                    type="email"
                    required
                    placeholder="you@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "rgba(42,10,24,0.12)", ["--tw-ring-color" as never]: selected.ring }}
                  />
                </label>
                <label className="block">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-semibold">Password</span>
                    <Link to="/reset-password" className="text-[12px] opacity-55 hover:opacity-100">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm outline-none focus:ring-2"
                      style={{ borderColor: "rgba(42,10,24,0.12)", ["--tw-ring-color" as never]: selected.ring }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 opacity-60 hover:opacity-100"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{ background: selected.accent, boxShadow: `0 18px 40px -18px ${selected.ring}` }}
                >
                  {isLoading ? "Signing in…" : `Sign in as ${selected.title}`}
                  {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="mt-6 space-y-5">
                <FormSection title="Admin details">
                  <Field label="Full Name" required>
                    <TextInput
                      placeholder="Dr. John Smith"
                      ring={selected.ring}
                      value={signup.fullName}
                      onChange={(e) => setSignup({ ...signup, fullName: e.target.value })}
                    />
                  </Field>
                  <Field label="Gmail address" required>
                    <TextInput
                      type="email"
                      placeholder="yourname@gmail.com"
                      ring={selected.ring}
                      value={signup.email}
                      onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                    />
                  </Field>
                </FormSection>

                <FormSection title="Clinic / Hospital">
                  <Field label="Clinic/Hospital Name" required>
                    <TextInput
                      placeholder="MediCare Hospital"
                      ring={selected.ring}
                      value={signup.clinicName}
                      onChange={(e) => setSignup({ ...signup, clinicName: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Clinic Phone Number" required>
                      <TextInput
                        type="tel"
                        placeholder="+91-9876543210"
                        ring={selected.ring}
                        value={signup.clinicPhone}
                        onChange={(e) => setSignup({ ...signup, clinicPhone: e.target.value })}
                      />
                    </Field>
                    <Field label="Clinic Email" hint="optional">
                      <TextInput
                        type="email"
                        placeholder="clinic@example.com"
                        ring={selected.ring}
                        value={signup.clinicEmail}
                        onChange={(e) => setSignup({ ...signup, clinicEmail: e.target.value })}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Address">
                  <Field label="Street Address" required>
                    <TextInput
                      placeholder="123 Main Street"
                      ring={selected.ring}
                      value={signup.address}
                      onChange={(e) => setSignup({ ...signup, address: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="City" required>
                      <TextInput
                        placeholder="Mumbai"
                        ring={selected.ring}
                        value={signup.city}
                        onChange={(e) => setSignup({ ...signup, city: e.target.value })}
                      />
                    </Field>
                    <Field label="State" required>
                      <select
                        required
                        value={signup.state}
                        onChange={(e) => setSignup({ ...signup, state: e.target.value })}
                        className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2"
                        style={{
                          borderColor: "rgba(42,10,24,0.12)",
                          ["--tw-ring-color" as never]: selected.ring,
                        }}
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {IN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Pincode" required>
                      <TextInput
                        placeholder="400001"
                        ring={selected.ring}
                        value={signup.pincode}
                        onChange={(e) => setSignup({ ...signup, pincode: e.target.value })}
                      />
                    </Field>
                    <Field label="Country" required>
                      <TextInput
                        placeholder="India"
                        ring={selected.ring}
                        value={signup.country}
                        onChange={(e) => setSignup({ ...signup, country: e.target.value })}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Additional details">
                  <Field label="Website">
                    <TextInput
                      type="url"
                      placeholder="https://www.example.com"
                      ring={selected.ring}
                      value={signup.website}
                      onChange={(e) => setSignup({ ...signup, website: e.target.value })}
                    />
                  </Field>
                  <Field label="Registration/License Number" hint="optional">
                    <TextInput
                      placeholder="MED/2024/12345"
                      ring={selected.ring}
                      value={signup.registrationNumber}
                      onChange={(e) => setSignup({ ...signup, registrationNumber: e.target.value })}
                    />
                  </Field>
                </FormSection>

                <FormSection title="Set a password">
                  <Field label="Password" required>
                    <PasswordInput
                      show={showPwd}
                      setShow={setShowPwd}
                      placeholder="Create a password"
                      ring={selected.ring}
                      value={signup.password}
                      onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Confirm Password" required>
                    <PasswordInput
                      show={showPwd2}
                      setShow={setShowPwd2}
                      placeholder="Confirm your password"
                      ring={selected.ring}
                      value={signup.confirmPassword}
                      onChange={(e) => setSignup({ ...signup, confirmPassword: e.target.value })}
                      required
                    />
                  </Field>
                </FormSection>

                <label className="flex items-start gap-2.5 text-[12.5px] leading-relaxed opacity-80">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-[rgba(42,10,24,0.25)]" required />
                  <span>
                    I agree to MediEase's{" "}
                    <Link to="/terms-of-service" className="font-semibold underline decoration-dotted underline-offset-2">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="font-semibold underline decoration-dotted underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: selected.accent, boxShadow: `0 18px 40px -18px ${selected.ring}` }}
                >
                  {isLoading ? "Creating account…" : "Create Account"}
                  {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>

                <p className="text-center text-[12.5px] opacity-60">
                  We'll email you a verification link before activating your account.
                </p>
              </form>
            )}

            <p className="mt-6 text-center text-[13px] opacity-65">
              {activeMode === "login" ? (
                isAdmin ? (
                  <>
                    New to MediEase?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                        setSignupSuccess(null);
                      }}
                      className="font-semibold underline decoration-dotted underline-offset-4"
                      style={{ color: selected.accent }}
                    >
                      Create an admin account
                    </button>
                  </>
                ) : (
                  <>
                    New to MediEase?{" "}
                    <Link
                      to="/"
                      className="font-semibold underline decoration-dotted underline-offset-4"
                      style={{ color: selected.accent }}
                    >
                      Book a demo
                    </Link>
                  </>
                )
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="font-semibold underline decoration-dotted underline-offset-4"
                    style={{ color: selected.accent }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 text-[11px] opacity-50">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> 256-bit encrypted
              </span>
              <span>·</span>
              <span>HIPAA</span>
              <span>·</span>
              <span>NHA aligned</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TextInput({
  ring,
  type = "text",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { ring: string }) {
  return (
    <input
      type={type}
      className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2"
      style={{
        borderColor: "rgba(42,10,24,0.12)",
        ["--tw-ring-color" as never]: ring,
      }}
      {...rest}
    />
  );
}

function PasswordInput({
  show,
  setShow,
  placeholder,
  ring,
  ...rest
}: {
  show: boolean;
  setShow: (v: boolean) => void;
  placeholder: string;
  ring: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm outline-none transition-all focus:ring-2"
        style={{
          borderColor: "rgba(42,10,24,0.12)",
          ["--tw-ring-color" as never]: ring,
        }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 opacity-60 hover:opacity-100"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
        {label}
        {required && <span style={{ color: "#c0392b" }}>*</span>}
        {hint && <span className="text-[11.5px] font-normal opacity-55">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="overflow-hidden rounded-2xl border bg-white shadow-[0_1px_0_rgba(42,10,24,0.02),0_8px_24px_-18px_rgba(42,10,24,0.18)]"
      style={{ borderColor: "rgba(42,10,24,0.08)" }}
    >
      <header
        className="flex items-center gap-2.5 border-b px-5 py-3"
        style={{
          borderColor: "rgba(42,10,24,0.06)",
          background: "linear-gradient(180deg, rgba(246,239,227,0.55) 0%, rgba(246,239,227,0) 100%)",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#2a0a18", opacity: 0.55 }} />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-65">{title}</h3>
      </header>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  );
}
