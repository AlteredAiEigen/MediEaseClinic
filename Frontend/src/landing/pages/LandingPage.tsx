import { Link, useLocation } from "react-router-dom";
import { openDemoDrawer } from "@/landing/components/DemoDrawer";
import React, { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/landing/components/SiteHeader";
import { ASSETS } from "@/landing/assets/assets";

type Scene = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  accent: string;
};

const scenes: Scene[] = [
  {
    eyebrow: "Front desk",
    title: "Register, schedule, queue.",
    body: "Patients check in at the counter and wait calmly for their token — the OPD just flows.",
    image: ASSETS.heroEhr,
    accent: "var(--teal-deep)",
  },
  {
    eyebrow: "Consultation",
    title: "On the desk, quietly listening.",
    body: "MediEase sits on the laptop between doctor and patient, capturing the visit so nothing important is lost.",
    image: ASSETS.heroListen,
    accent: "var(--moss)",
  },
  {
    eyebrow: "Ask about the patient",
    title: "Ask anything, mid-visit.",
    body: "Pull up last labs, meds or past visits in plain language — right while the patient is in front of you.",
    image: ASSETS.heroRag,
    accent: "var(--teal-deep)",
  },
  {
    eyebrow: "Auto-update",
    title: "Transcribed. Extracted. Filed.",
    body: "The recording is transcribed, the details are extracted, and the patient's profile updates on its own.",
    image: ASSETS.heroAutoprofile,
    accent: "var(--teal-deep)",
  },
  {
    eyebrow: "Prescriptions",
    title: "Signed, sent, saved.",
    body: "A tap delivers the Rx to the patient and files it against their record.",
    image: ASSETS.heroRx,
    accent: "var(--clay)",
  },
  {
    eyebrow: "Follow-ups",
    title: "Reminders on WhatsApp.",
    body: "Patients see the reminder, then confirm or cancel right inside the chat.",
    image: ASSETS.heroReminder,
    accent: "var(--moss)",
  },
];

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#features") {
      const el = document.getElementById("features");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LiveBackdrop />
      <div className="relative z-30 bg-white">
        <SiteHeader variant="light" />
      </div>
      <Hero />
      <FlowMarquee />
      <Testimonial />
      <SmartFeatures />
      <ClinicalTasks />
      <ComplianceStrip />
      <ClosingTestimonial />
      <HealthierCareCTA />
    </div>
  );
}

const complianceBadges: {
  title: string;
  logo?: string;
  grayscale?: boolean;
}[] = [
  { title: "National Health Authority", logo: ASSETS.logoNha },
  { title: "HIPAA", logo: ASSETS.logoHipaa },
  { title: "AWS Secured", logo: ASSETS.awsCertified, grayscale: true },
];

function ComplianceStrip() {
  return (
    // Negative top margin pulls the cream card up so it overlaps the
    // dark Tackle section above — matching Heidi's layered pattern.
    <section
      aria-label="Standards and compliance"
      className="relative z-20 -mt-24 px-4 pb-20 sm:-mt-32 sm:px-6 sm:pb-28 lg:px-8"
    >
      <div
        className="relative mx-auto w-full max-w-[88rem] rounded-[2.25rem] px-6 py-10 shadow-[0_30px_80px_-50px_rgba(42,6,18,0.45)] sm:px-12 sm:py-14"
        style={{ background: "#f5ece1" }}
      >
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2
            className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] tracking-tight"
            style={{ color: "#2a0612" }}
          >
            Held to the highest
            <br />
            standards of care
          </h2>
        </div>

        <ul className="mt-8 grid grid-cols-3 gap-4">
          {complianceBadges.map((b) => (
            <li key={b.title} className="flex flex-col items-center gap-2">
              <img
                src={b.logo}
                alt={b.title}
                width={64}
                height={64}
                loading="lazy"
                className={`h-16 w-16 object-contain ${b.grayscale ? "grayscale brightness-75 contrast-150" : ""}`}
              />
              <span className="text-center text-[11px] font-semibold leading-tight" style={{ color: "#2a0612" }}>
                {b.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const testimonial = {
  quote: "I stay organized so I can manage consultations smoothly, see more patients, and go home on time.",
  name: "Dr. Chandra Shekhar",
  role: "Chandigarh, hospital",
};

const closingTestimonial = {
  quote:
    "We're designing MediEase so clinicians can focus on patients, not paperwork — turning every visit into a calm, connected experience.",
  name: "MediEase Team",
  role: "",
};

function Testimonial() {
  return (
    <section aria-label="What clinicians say" className="relative z-10 pt-8 pb-20 sm:pt-12 sm:pb-28">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <blockquote className="font-display text-[clamp(1.6rem,3.8vw,2.8rem)] leading-[1.25] tracking-tight text-foreground">
          “{testimonial.quote}”
        </blockquote>

        <figcaption className="mt-6 flex items-center justify-center gap-2 text-sm">
          <span className="font-semibold text-foreground">{testimonial.name}</span>
          {testimonial.role && <span className="text-foreground/60">· {testimonial.role}</span>}
        </figcaption>
      </div>
    </section>
  );
}

function ClosingTestimonial() {
  return (
    <section aria-label="Partner testimonial" className="relative z-10 pt-8 pb-20 sm:pt-12 sm:pb-28">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <blockquote className="font-display text-[clamp(1.6rem,3.8vw,2.8rem)] leading-[1.25] tracking-tight text-foreground">
          "{closingTestimonial.quote}"
        </blockquote>

        <figcaption className="mt-6 flex items-center justify-center gap-2 text-sm">
          <span className="font-semibold text-foreground">{closingTestimonial.name}</span>
          {closingTestimonial.role && <span className="text-foreground/60">· {closingTestimonial.role}</span>}
        </figcaption>
      </div>
    </section>
  );
}

// ===================================================================
// SMART FEATURES — Heidi-style 2x2 quad. Each card has its own tint,
// a live-looking mockup, a headline, and a dark plum pill button that
// matches the ClinicalTasks palette. The first card's note is
// contentEditable so the surface feels alive.
// ===================================================================

const PLUM_BTN = "#3a0a1f";

function PillButton({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-transform group-hover:-translate-y-0.5"
      style={{ background: "#f5e58a", color: PLUM_BTN }}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function NoteMockup() {
  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 80% 30%, #f0d36a 0%, #e9c45a 35%, #d9b14a 70%, #b8923a 100%)",
        }}
      />
      <div className="relative flex h-full items-center justify-center p-6">
        <div className="w-full max-w-[340px]">
          <div className="rounded-xl bg-white p-3.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-foreground/70">Consultation summary</div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Auto-drafted
              </span>
            </div>
            <dl className="mt-2 space-y-1.5 text-[11px] leading-snug">
              <div className="grid grid-cols-[88px_1fr] gap-2">
                <dt className="text-foreground/55">Chief complaint</dt>
                <dd className="text-foreground/90">Persistent dry cough, 5 days, worse at night</dd>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-2">
                <dt className="text-foreground/55">History</dt>
                <dd className="text-foreground/90">Low-grade fever, no travel, non-smoker</dd>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-2">
                <dt className="text-foreground/55">Examination</dt>
                <dd className="text-foreground/90">Mild pharyngeal erythema, chest clear</dd>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-2">
                <dt className="text-foreground/55">Diagnosis</dt>
                <dd className="text-foreground/90">Acute viral upper respiratory infection</dd>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-2">
                <dt className="text-foreground/55">Plan</dt>
                <dd className="text-foreground/90">Symptomatic care, review in 5 days if no improvement</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrescriptionMockup() {
  // Interactive cycle:
  // 0 empty → 1 typing "Para" → 2 dropdown visible → 3 selected (row filled)
  // 4 share panel slides in → 5 typing phone → 6 sending → 7 sent (delivered ✓✓)
  const STEPS = 8;
  const DURATIONS = [900, 1100, 1100, 1100, 900, 1100, 900, 1600];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS), DURATIONS[step]);
    return () => clearTimeout(t);
  }, [step]);

  const typed = step >= 2 ? "Paracet" : step === 1 ? "Para" : "";
  const showDropdown = step === 1 || step === 2;
  const selected = step >= 3;
  const showShare = step >= 4;
  const phoneTyped = step >= 6 ? "98978 44811" : step === 5 ? "98978" : "";
  const sending = step === 6;
  const sent = step === 7;

  const options = [
    { name: "Paracetamol 500 mg", sub: "TAB · in formulary", hot: true },
    { name: "Paracetamol 650 mg", sub: "TAB · in formulary" },
    { name: "Paracetamol + Caffeine", sub: "TAB · in formulary" },
    { name: `+ Add "${typed || "new"}" as new entry`, sub: "Create custom medicine", add: true },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Heidi-style warm peach gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 20% 15%, #ffe6d2 0%, #ffd2b0 35%, #f4a97a 70%, #d97a4a 100%)",
        }}
      />
      <div className="relative grid h-full place-items-center p-6">
        <div className="relative w-full max-w-[360px]">
          {/* Prescription card */}
          <div className="rounded-xl bg-white p-3 shadow-[0_25px_55px_-25px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px]">🩺</span>
                <div>
                  <div className="text-[10px] font-bold text-foreground/85 leading-tight">
                    Combined Medical Institute
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-foreground/55">Doon ENT Hospital</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-emerald-700 leading-tight">Dr. Anshika Jain</div>
                <div className="text-[8px] text-foreground/55">M.D. (Medicine)</div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                { l: "Patient", v: "R. Sharma" },
                { l: "Age", v: "42" },
                { l: "Phone", v: "98978…" },
              ].map((f) => (
                <div key={f.l} className="rounded border border-border/60 px-1.5 py-1">
                  <div className="text-[8px] uppercase tracking-wider text-foreground/50">{f.l}</div>
                  <div className="text-[10px] font-medium text-foreground/85">{f.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <div className="text-[10px] font-semibold text-foreground/75">Medicines</div>
              <div className="mt-1 overflow-hidden rounded-md border border-border/60">
                <div className="grid grid-cols-[1.5fr_0.6fr_1fr_0.4fr] bg-foreground/[0.05] px-1.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-foreground/60">
                  <span>Medicine</span>
                  <span>Dose</span>
                  <span>Timing</span>
                  <span>Qty</span>
                </div>

                {/* Interactive row 1 */}
                <div className="relative grid grid-cols-[1.5fr_0.6fr_1fr_0.4fr] items-center px-1.5 py-1 text-[9.5px] text-foreground/85">
                  <div className="pr-1">
                    <div
                      className={`flex items-center gap-1 rounded border px-1 py-[2px] transition-colors ${
                        showDropdown
                          ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-400/40"
                          : "border-border/60 bg-white"
                      }`}
                    >
                      <span className="text-[9px] text-foreground/55">TAB</span>
                      <span className="font-medium truncate text-foreground/90">
                        {selected ? "Paracetamol 500 mg" : typed}
                        {!selected && showDropdown && (
                          <span className="ml-[1px] inline-block h-[8px] w-[1px] animate-pulse bg-foreground/70 align-middle" />
                        )}
                      </span>
                    </div>
                  </div>
                  <span className={selected ? "text-foreground/85" : "text-foreground/30"}>
                    {selected ? "500 mg" : "—"}
                  </span>
                  <span className={selected ? "text-foreground/85" : "text-foreground/30"}>
                    {selected ? "1-0-1 · 5 d" : "—"}
                  </span>
                  <span className={selected ? "text-foreground/85" : "text-foreground/30"}>
                    {selected ? "10" : "—"}
                  </span>

                  {/* Dropdown */}
                  <div
                    className={`absolute left-1 right-1 top-[28px] z-10 origin-top rounded-md border border-border/70 bg-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 ${
                      showDropdown ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                    }`}
                  >
                    {options.map((o, i) => (
                      <div
                        key={o.name}
                        className={`flex items-center justify-between px-1.5 py-1 text-[9px] ${
                          i === 0 && step === 2
                            ? "bg-emerald-50"
                            : o.add
                              ? "border-t border-dashed border-border/60 text-emerald-700"
                              : "text-foreground/80"
                        }`}
                      >
                        <span className="truncate">
                          <span className={o.hot ? "font-semibold" : ""}>{o.name}</span>
                        </span>
                        <span className="ml-1 shrink-0 text-[8px] text-foreground/45">{o.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Static row 2 */}
                <div className="grid grid-cols-[1.5fr_0.6fr_1fr_0.4fr] items-center bg-foreground/[0.02] px-1.5 py-1 text-[9.5px] text-foreground/80">
                  <span className="font-medium truncate">TAB Levocetirizine</span>
                  <span>5 mg</span>
                  <span>0-0-1 · 5 d</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <span className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[9.5px] font-semibold text-white">
                Save Rx
              </span>
              <span className="inline-flex items-center justify-center gap-1 rounded-md border border-border/70 bg-white px-2 py-1 text-[9.5px] font-semibold text-foreground/75">
                Print
              </span>
              <span
                className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[9.5px] font-semibold transition-colors ${
                  showShare ? "bg-emerald-600 text-white" : "border border-border/70 bg-white text-foreground/75"
                }`}
              >
                Share
              </span>
            </div>
          </div>

          {/* Share / WhatsApp panel */}
          <div
            className={`absolute -bottom-6 -right-4 w-[200px] rounded-xl bg-white p-2 shadow-[0_30px_55px_-15px_rgba(0,0,0,0.5)] ring-1 ring-border/70 transition-all duration-300 ${
              showShare ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold text-foreground/85">Share via WhatsApp</div>
              <span className="text-[10px] text-foreground/40">×</span>
            </div>
            <div className="mt-1.5 rounded-md border border-border/60 p-1.5">
              <div className="flex items-center gap-1 text-[8.5px] font-semibold text-emerald-700">
                <span>💬</span> WhatsApp number
              </div>
              <div
                className={`mt-1 rounded border px-1.5 py-1 text-[9px] ${
                  step === 5 || step === 6 ? "border-emerald-500 ring-1 ring-emerald-400/40" : "border-border/60"
                }`}
              >
                <span className="text-foreground/85">
                  +91 {phoneTyped || <span className="text-foreground/30">98978 44811</span>}
                </span>
                {(step === 5 || step === 6) && (
                  <span className="ml-[1px] inline-block h-[8px] w-[1px] animate-pulse bg-foreground/70 align-middle" />
                )}
              </div>
              <div
                className={`mt-1 flex items-center justify-center gap-1 rounded px-1.5 py-1 text-[8.5px] font-semibold text-white transition-colors ${
                  sending ? "bg-emerald-700" : "bg-emerald-600"
                }`}
              >
                {sending ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white/80" />
                    Sending…
                  </>
                ) : sent ? (
                  <>✓ Sent to patient</>
                ) : (
                  <>Download PDF &amp; Send</>
                )}
              </div>
            </div>

            {/* WhatsApp message bubble that appears on send */}
            <div
              className={`mt-1.5 transition-all duration-300 ${
                sent ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
              }`}
            >
              <div className="ml-auto w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] px-1.5 py-1 shadow-sm">
                <div className="flex items-center gap-1 text-[8.5px] font-semibold text-emerald-800">
                  📄 prescription.pdf
                </div>
                <div className="text-[8px] text-foreground/65">Dr. Anshika Jain · 2 pages</div>
                <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[8px] text-emerald-700">
                  10:42 <span className="font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaptopAudioMockup() {
  const messages = [
    { role: "doctor", text: "Pull up Mrs. Sharma's last visit summary." },
    {
      role: "ai",
      text: "Visited 12 Jun · Type-2 diabetes review. HbA1c 7.8% (↑0.4). On Metformin 1g BD. BP 138/86.",
      cites: ["Visit 12 Jun", "Lab 09 Jun"],
    },
    { role: "doctor", text: "Any allergy or recent medication change?" },
    {
      role: "ai",
      text: "No drug allergies on file. Statin started 02 May. Reports mild myalgia since.",
      cites: ["Rx history"],
    },
  ];
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 30% 70%, #b9d4d0 0%, #8fb9b4 40%, #6a9994 75%, #4a7a77 100%)",
        }}
      />
      <div className="relative grid h-full place-items-center p-6">
        <div className="w-full max-w-[340px] rounded-xl bg-white/95 p-3 shadow-[0_25px_55px_-25px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/75">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-deep text-[9px] text-white">M</span>
              Ask about patient · Mrs. Sharma
            </div>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
              RAG
            </span>
          </div>
          <div className="space-y-1.5">
            {messages.map((m, i) =>
              m.role === "doctor" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-foreground/[0.06] px-2.5 py-1.5 text-[11px] text-foreground/85"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={i}
                  className="mr-auto max-w-[90%] rounded-lg rounded-tl-sm bg-teal-deep/95 px-2.5 py-1.5 text-[11px] leading-snug text-white"
                >
                  {m.text}
                  {m.cites && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.cites.map((c) => (
                        <span key={c} className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
            <span className="text-[11px] text-foreground/40">Ask about labs, history, meds…</span>
            <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-teal-deep text-[10px] text-white">
              ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandMockup() {
  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #f1ece2 0%, #e7dfcf 100%)" }}
      />
      <div className="relative grid h-full place-items-center p-6">
        <div className="w-full max-w-[320px] rounded-xl bg-white p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground/70">Today · Sunrise Clinic</span>
            <span className="text-[10px] rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">
              On time
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { k: "Queue", v: "7" },
              { k: "Done", v: "12" },
              { k: "Revenue", v: "₹18.4k" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-foreground/[0.04] p-2">
                <div className="text-[9px] uppercase tracking-wider text-foreground/55">{s.k}</div>
                <div className="font-display text-base text-foreground">{s.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { name: "R. Iyer", time: "10:20", tag: "Follow-up", color: "bg-sky-100 text-sky-700" },
              { name: "M. Khan", time: "10:35", tag: "New", color: "bg-violet-100 text-violet-700" },
              { name: "S. Pillai", time: "10:50", tag: "Lab review", color: "bg-amber-100 text-amber-700" },
            ].map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 grid place-items-center rounded-full bg-foreground/10 text-[10px] font-semibold">
                    {r.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <span className="text-[11px] font-medium">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${r.color}`}>{r.tag}</span>
                  <span className="text-[10px] text-foreground/60">{r.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceMockup() {
  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 100% at 70% 30%, #93b58a 0%, #7aa372 40%, #5d8a58 75%, #3f6a3f 100%)",
        }}
      />
      <div className="relative grid h-full place-items-center p-6">
        <div className="w-full max-w-[330px] space-y-2.5">
          <div className="rounded-xl bg-white px-3 py-2.5 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.35)]">
            <div className="text-[12px] font-medium text-foreground">
              What's the next step for Jane's partial response to fluoxetine at 6 weeks?
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.35)]">
            <p className="text-[11.5px] leading-relaxed text-foreground/85">
              Guidelines recommend titrating to 40mg at this stage. If response remains inadequate at 8–12 weeks,
              consider augmentation or a psychology referral.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold rounded bg-rose-100 text-rose-700 px-1.5 py-0.5">Vidal</span>
              <span className="text-[10px] font-semibold rounded bg-sky-100 text-sky-700 px-1.5 py-0.5">
                EMGuidance
              </span>
              <span className="text-[10px] font-semibold rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">BMJ</span>
            </div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
              Dosage guidance
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SmartCard = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  mockup: () => React.ReactElement;
  // visual layout: image on top vs image right
  layout: "right" | "top";
  surface: string;
};

const smartCards: SmartCard[] = [
  {
    eyebrow: "Patient notes",
    title: "Consultation, summarised.",
    body: "MediEase listens during the visit and drafts a structured summary — chief complaint, history, examination, diagnosis and plan — ready before the patient leaves the room.",
    cta: "Scribe",
    mockup: NoteMockup,
    layout: "right",
    surface: "#f1ebe1",
  },
  {
    eyebrow: "e-Prescriptions",
    title: "Prescription, in one tap.",
    body: "A dedicated prescription page opens during the visit. Pick medicines, dose and timing, then save, print, or share instantly with the patient over Email or WhatsApp.",
    cta: "Prescribe",
    mockup: PrescriptionMockup,
    layout: "right",
    surface: "#f3e5d4",
  },

  {
    eyebrow: "Patient intelligence",
    title: "Ask anything about your patient.",
    body: "A RAG-powered assistant grounded in each patient's records — ask mid-consult about history, allergies, labs or past prescriptions and get cited answers instantly.",
    cta: "Ask",
    mockup: LaptopAudioMockup,
    layout: "top",
    surface: "#e9efee",
  },
  {
    eyebrow: "Clinical evidence",
    title: "Clinical decisions, informed.",
    body: "MediEase has unlimited clinical evidence on tap — just ask, mid-consult.",
    cta: "Evidence",
    mockup: EvidenceMockup,
    layout: "top",
    surface: "#e9efe6",
  },
];

function SmartFeatures() {
  return (
    <section id="features" aria-label="Smart features" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-deep">Smart features</p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Intelligence built into every step of care.
            </h2>
          </div>
          <p className="max-w-md text-base text-foreground/65 lg:text-right">
            Hover, click, edit — these surfaces respond like the real product. Purpose-built tools that help your clinic
            run calmer.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {smartCards.map((c) => {
            const Mockup = c.mockup;
            const isRight = c.layout === "right";
            return (
              <article
                key={c.title}
                className="group relative overflow-hidden rounded-3xl border border-foreground/5 shadow-[0_30px_70px_-40px_rgba(15,40,50,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_-40px_rgba(15,40,50,0.5)]"
                style={{ background: c.surface, minHeight: 460 }}
              >
                {isRight ? (
                  <div className="grid h-full grid-cols-1 sm:grid-cols-[1fr_1.05fr]">
                    <div className="flex flex-col justify-between p-7 sm:p-8">
                      <div>
                        <h3 className="font-display text-2xl leading-tight tracking-tight text-foreground sm:text-[1.9rem]">
                          {c.title}
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-foreground/65">{c.body}</p>
                      </div>
                    </div>
                    <div className="relative min-h-[260px] sm:min-h-full">
                      <Mockup />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="relative h-[260px] sm:h-[300px]">
                      <Mockup />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-7 sm:p-8">
                      <div>
                        <h3 className="font-display text-2xl leading-tight tracking-tight text-foreground sm:text-[1.9rem]">
                          {c.title}
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-foreground/65">{c.body}</p>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===================================================================
// CLINICAL TASKS — Heidi-style vertical marquee of clinical task lines on a
// dark plum background. Each line scrolls up; the line crossing the center
// row is highlighted. Edit `clinicalTaskLines` to add/remove lines later.
// ===================================================================

const clinicalTaskLines: string[] = [
  "Patient communications",
  "Revenue leakage identification",
  "Prior authorisations",
  "Referral management",
  "Care gap closure",
  "Clinical documentation",
  "Follow-up scheduling",
];

function ClinicalTasks() {
  // Duplicate the list so the vertical marquee loops seamlessly.
  const loop = [...clinicalTaskLines, ...clinicalTaskLines];

  return (
    <section
      id="clinical-tasks"
      aria-label="Tackles every clinical task"
      className="relative z-10 overflow-hidden pt-16 pb-40 sm:pt-24 sm:pb-56"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 20%, color-mix(in oklab, var(--teal-deep) 18%, var(--ink)) 0%, var(--ink) 55%, color-mix(in oklab, var(--ink) 92%, black) 100%)",
        color: "var(--cream)",
      }}
    >
      <div className="relative">
        {/* Subtle ambient glow behind the marquee */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--teal-deep) 55%, transparent) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_minmax(160px,1fr)] lg:px-10">
          {/* Left: label */}
          <div className="text-left">
            <h2 className="font-display text-base font-semibold leading-snug tracking-tight text-cream sm:text-lg">
              Tackles every clinical task.
              <br />
              Tailored to your workforce.
            </h2>
          </div>

          {/* Center: vertical marquee with bright "active" band */}
          <div
            className="group relative mx-auto h-[360px] w-full max-w-xl overflow-hidden sm:h-[420px]"
            style={{
              maskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)",
            }}
          >
            {/* Dim base layer (all lines faded) */}
            <div className="absolute inset-0 flex flex-col items-center marquee-y group-hover:marquee-paused">
              {loop.map((line, i) => (
                <div
                  key={`dim-${line}-${i}`}
                  className="flex h-[72px] shrink-0 items-center justify-center text-center font-display text-2xl leading-tight tracking-tight sm:h-[84px] sm:text-[2rem]"
                  style={{
                    color: "color-mix(in oklab, var(--cream) 22%, transparent)",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Bright overlay layer — masked to the center band */}
            <div
              className="pointer-events-none absolute inset-0 flex flex-col items-center marquee-y group-hover:marquee-paused"
              style={{
                maskImage: "linear-gradient(180deg, transparent 42%, #000 48%, #000 52%, transparent 58%)",
                WebkitMaskImage: "linear-gradient(180deg, transparent 42%, #000 48%, #000 52%, transparent 58%)",
              }}
            >
              {loop.map((line, i) => (
                <div
                  key={`bright-${line}-${i}`}
                  className="flex h-[72px] shrink-0 items-center justify-center text-center font-display text-2xl leading-tight tracking-tight sm:h-[84px] sm:text-[2rem]"
                  style={{
                    color: "var(--cream)",
                    textShadow:
                      "0 0 24px color-mix(in oklab, var(--teal-soft) 60%, transparent), 0 0 48px color-mix(in oklab, var(--teal-deep) 25%, transparent)",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex lg:justify-end">
            <Link
              to="/safety"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{
                background: "var(--butter, #f5e58a)",
                color: "#3a0a1f",
              }}
            >
              Explore enterprise
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===================================================================
// TAILORED WORKFORCE — horizontal marquee of role cards.
// Edit `workforceRoles` to add/remove roles in the moving content.
// ===================================================================

type WorkforceRole = {
  role: string;
  blurb: string;
  accent: string;
  emoji: string;
};

const workforceRoles: WorkforceRole[] = [
  {
    role: "Family Physician",
    blurb: "Calmer OPDs, complete notes by closing time.",
    accent: "var(--teal-deep)",
    emoji: "🩺",
  },
  {
    role: "Paediatrician",
    blurb: "Growth charts, vaccines and parents — in one view.",
    accent: "var(--apricot)",
    emoji: "🧸",
  },
  {
    role: "Cardiologist",
    blurb: "Lab trends and ECGs threaded across every visit.",
    accent: "var(--clay)",
    emoji: "❤️",
  },
  {
    role: "Dermatologist",
    blurb: "Photo timeline, regimen tracking, follow-up nudges.",
    accent: "var(--blush)",
    emoji: "✨",
  },
  {
    role: "Gynaecologist",
    blurb: "Cycles, pregnancies and screenings, gently tracked.",
    accent: "var(--plum)",
    emoji: "🌷",
  },
  { role: "Dentist", blurb: "Tooth charts, treatment plans, recall reminders.", accent: "var(--violet)", emoji: "🦷" },
  {
    role: "Physiotherapist",
    blurb: "Session notes, exercise plans, progress in one place.",
    accent: "var(--moss)",
    emoji: "🧘",
  },
  {
    role: "Front desk",
    blurb: "Queue, billing and intake — without the chaos.",
    accent: "var(--teal-deep)",
    emoji: "🗂️",
  },
  {
    role: "Clinic owner",
    blurb: "Revenue, footfall and follow-ups at a glance.",
    accent: "var(--violet)",
    emoji: "📈",
  },
  { role: "Nurse", blurb: "Vitals, triage and handoffs — without paperwork.", accent: "var(--mint)", emoji: "💉" },
];

function TailoredWorkforce() {
  // Duplicate for seamless marquee loop
  const loop = [...workforceRoles, ...workforceRoles];

  return (
    <section aria-label="Tailored to your workforce" className="relative z-10 overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-deep">Every role, supported</p>
          <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-[2.6rem]">
            Tailored to your workforce.
          </h2>
          <p className="mt-4 text-base text-foreground/65">
            Whether you're a solo physician or a busy multi-specialty clinic — MediEase adapts to the way each person
            works.
          </p>
        </div>
      </div>

      <div
        className="relative"
        style={{
          maskImage: "linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)",
        }}
      >
        <div className="flex w-max gap-5 marquee-x hover:marquee-paused">
          {loop.map((r, i) => (
            <article
              key={`${r.role}-${i}`}
              className="flex w-[280px] shrink-0 flex-col justify-between rounded-2xl border p-5 shadow-[0_18px_45px_-32px_rgba(15,40,50,0.4)] backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${r.accent} 16%, white) 0%, color-mix(in oklab, ${r.accent} 6%, white) 100%)`,
                borderColor: `color-mix(in oklab, ${r.accent} 25%, white)`,
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{
                  background: `color-mix(in oklab, ${r.accent} 22%, white)`,
                }}
              >
                <span aria-hidden>{r.emoji}</span>
              </div>
              <div className="mt-5">
                <h3 className="font-display text-lg leading-tight tracking-tight text-foreground">{r.role}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/65">{r.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===================================================================
// HEALTHIER CARE — closing CTA (deep, colored background)
// ===================================================================

function HealthierCareCTA() {
  return (
    <section aria-label="Healthier care, starts today" className="relative z-10 pb-16 pt-6 sm:pb-24">
      <div
        className="relative mx-3 sm:mx-5 lg:mx-10 overflow-hidden rounded-[2.5rem] px-6 py-20 text-center sm:px-12 sm:py-28"
        style={{
          background: "linear-gradient(180deg, #bdd6f0 0%, #c9ddf2 40%, #d4e3f3 70%, #e8e2b8 100%)",
        }}
      >
        {/* Left decorative curve */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -left-2 top-0 h-full w-[12%] min-w-[100px] max-w-[180px]"
          viewBox="0 0 160 600"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M80 0 C20 80, 140 180, 80 260 C20 340, 140 440, 80 520 C20 600, 80 600, 80 600"
            stroke="#f5e58a"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 0 C-20 100, 100 200, 40 280 C-20 360, 100 460, 40 540 C-20 620, 40 600, 40 600"
            stroke="#f5e58a"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Right decorative curve */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-2 top-0 h-full w-[12%] min-w-[100px] max-w-[180px]"
          viewBox="0 0 160 600"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M80 0 C140 80, 20 180, 80 260 C140 340, 20 440, 80 520 C140 600, 80 600, 80 600"
            stroke="#f5e58a"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M120 0 C180 100, 60 200, 120 280 C180 360, 60 460, 120 540 C180 620, 120 600, 120 600"
            stroke="#f5e58a"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Soft blurred circles for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[20%] top-[30%] h-32 w-32 rounded-full blur-3xl opacity-40"
          style={{ background: "#a8c4e0" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[25%] bottom-[20%] h-40 w-40 rounded-full blur-3xl opacity-30"
          style={{ background: "#d4c97a" }}
        />

        <p className="relative text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: "#3a0a1f" }}>
          Start with MediEase
        </p>
        <h2
          className="relative mx-auto mt-4 max-w-4xl font-display text-[clamp(2.2rem,5.5vw,4.25rem)] font-medium leading-[1.05] tracking-tight"
          style={{ color: "#3a0a1f" }}
        >
          Healthier care, starts today.
        </h2>
        <p
          className="relative mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: "#3a0a1f", opacity: 0.75 }}
        >
          Bring every patient's story into one calm place — and give your team back the hours they spend on paperwork.
        </p>
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openDemoDrawer}
            className="inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: "#f5e58a", color: "#3a0a1f" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book a demo
          </button>
        </div>
      </div>
    </section>
  );
}

function LiveBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--mint) 55%, var(--bone)) 0%, var(--bone) 55%, color-mix(in oklab, var(--sky) 35%, var(--bone)) 100%)",
        }}
      />
      <svg className="absolute inset-x-0 top-0 h-[120vh] w-full" viewBox="0 0 1440 1200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="curveA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--teal-soft) 70%, transparent)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--mint) 30%, transparent)" />
          </linearGradient>
          <linearGradient id="curveB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--apricot) 55%, transparent)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--blush) 20%, transparent)" />
          </linearGradient>
        </defs>
        <path
          d="M -100 420 C 280 220, 720 640, 1100 360 S 1640 380, 1640 380 L 1640 -80 L -100 -80 Z"
          fill="url(#curveA)"
          opacity="0.85"
        />
        <path
          d="M -100 680 C 360 520, 760 880, 1180 620 S 1640 660, 1640 660 L 1640 1240 L -100 1240 Z"
          fill="url(#curveB)"
          opacity="0.55"
        />
      </svg>
      <div
        className="absolute -top-24 -left-24 h-[50vw] w-[50vw] rounded-full blur-3xl blob-a"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--teal-soft) 60%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute top-[20%] -right-32 h-[45vw] w-[45vw] rounded-full blur-3xl blob-b"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--apricot) 45%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}

type HeroWorkflow = {
  word: string;
  tint: string;
  scene: "notes" | "history" | "workflows" | "rx" | "queues" | "reminders" | "followups" | "insights" | "records";
};

const rotatingItems: HeroWorkflow[] = [
  { word: "Clinical Notes", tint: "#7CE7FF", scene: "notes" },
  { word: "Patient History", tint: "#B79CFF", scene: "history" },
  { word: "Workflows", tint: "#86F1C5", scene: "workflows" },
  { word: "e-Prescriptions", tint: "#FFB088", scene: "rx" },
  { word: "Queues", tint: "#7CE7FF", scene: "queues" },
  { word: "Reminders", tint: "#FFA8C9", scene: "reminders" },
  { word: "Follow-Ups", tint: "#FFC987", scene: "followups" },
  { word: "Insights", tint: "#D6A0FF", scene: "insights" },
  { word: "LifeLong Records", tint: "#7CE7FF", scene: "records" },
];

function useTypedTarget(target: string) {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (display === target) return;
    let t: number;
    if (target.startsWith(display) && display.length < target.length) {
      t = window.setTimeout(() => setDisplay(target.slice(0, display.length + 1)), 55);
    } else {
      t = window.setTimeout(() => setDisplay(display.slice(0, -1)), 32);
    }
    return () => window.clearTimeout(t);
  }, [display, target]);
  return display;
}

function Hero() {
  const [idx, setIdx] = useState(0);
  const current = rotatingItems[idx];
  const displayWord = useTypedTarget(current.word);

  return (
    <section className="relative isolate min-h-[90vh] overflow-hidden text-white">
      <HeroMotionBackdrop current={current} onProgress={setIdx} />

      {/* centered headline */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-24 text-center lg:px-10 lg:pb-40 lg:pt-32">
        <h1 className="font-display text-[clamp(2rem,6.5vw,5.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:leading-[1.08]">
          Every Patient. Their Story. Anywhere.
          <br className="hidden sm:block" />{" "}
          <span className="sm:whitespace-nowrap">
            Healthcare Platform for{" "}
            <span className="relative inline-block">
              <span
                className="inline-block min-w-[8ch] bg-clip-text text-left text-transparent sm:min-w-[12ch]"
                style={{
                  backgroundImage: `linear-gradient(92deg, ${current.tint}, #B79CFF 60%, #7CE7FF)`,
                }}
              >
                {displayWord || "\u00A0"}
              </span>
            </span>
          </span>
        </h1>

        <button
          type="button"
          onClick={openDemoDrawer}
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-[#3D6BFF] px-7 py-4 text-sm font-semibold text-white shadow-[0_20px_60px_-20px_rgba(61,107,255,0.7)] transition-transform hover:-translate-y-0.5"
        >
          Explore Products
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </section>
  );
}

function HeroMotionBackdrop({ current, onProgress }: { current: HeroWorkflow; onProgress: (idx: number) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handle = () => {
      const dur = v.duration;
      if (!dur || !isFinite(dur)) return;
      const segment = dur / rotatingItems.length;
      const next = Math.min(rotatingItems.length - 1, Math.floor(v.currentTime / segment));
      onProgress(next);
    };
    v.addEventListener("timeupdate", handle);
    return () => v.removeEventListener("timeupdate", handle);
  }, [onProgress]);

  return (
    <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden">
      <div className="mx-auto flex h-full w-full items-center justify-center px-4 pt-4 pb-4 sm:px-6">
        <div className="relative h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl">
          <video
            ref={videoRef}
            src={ASSETS.heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{ filter: "brightness(1.2) contrast(1.05) saturate(1.05)" }}
          />
          <div
            className="absolute inset-0 transition-[background] duration-700"
            style={{
              background: `radial-gradient(circle at 25% 20%, ${current.tint}33, transparent 45%), linear-gradient(135deg, rgba(7,17,28,0.45) 0%, rgba(11,34,49,0.30) 50%, rgba(7,17,28,0.60) 100%)`,
            }}
          />
          <div className="hero-video-grain absolute inset-0 opacity-[0.10]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#07111c] via-[#07111c]/50 to-transparent" />
        </div>
      </div>

      <style>{`
        .hero-video-grain {
          background-image: radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px);
          background-size: 4px 4px;
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  );
}

function ClinicSet({ current }: { current: HeroWorkflow }) {
  const isQueue = current.scene === "queues";
  const isReminder = current.scene === "reminders";

  return (
    <div className="absolute inset-0">
      <div className="absolute left-[7%] top-[21%] h-[38%] w-[22%] rounded-[2rem] border border-white/12 bg-white/[0.055] shadow-[0_30px_90px_rgba(0,0,0,.24)] hero-float-a">
        <div className="absolute left-[12%] top-[18%] h-20 w-20 rounded-full bg-[#9bb8c8]" />
        <div className="absolute left-[17%] top-[38%] h-36 w-24 rounded-t-[3rem] bg-[#dfeaf0]" />
        <div className="absolute left-[46%] top-[22%] h-16 w-16 rounded-full bg-[#c99b78]" />
        <div className="absolute left-[43%] top-[40%] h-32 w-28 rounded-t-[3rem] bg-[#3d5f6d]" />
        <div className="absolute bottom-[14%] left-[18%] h-4 w-[62%] rounded-full bg-white/20" />
        <div className="absolute bottom-[20%] left-[28%] h-20 w-[44%] rounded-t-2xl border border-white/15 bg-[#111827]" />
      </div>

      {isQueue ? (
        <div className="absolute right-[8%] top-[17%] w-[28%] rounded-3xl border border-white/15 bg-[#071827]/90 p-5 shadow-[0_40px_90px_rgba(0,0,0,.35)] hero-float-b">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7CE7FF]">Queue Display</p>
          <div className="mt-4 rounded-2xl bg-[#101d29] p-5 text-center">
            <p className="text-sm text-white/65">Now Serving</p>
            <p className="mt-1 font-display text-6xl font-semibold text-white">A-14</p>
            <p className="mt-3 text-xs text-white/60">Next: A-15 · A-16 · A-17</p>
          </div>
        </div>
      ) : isReminder ? (
        <div className="absolute right-[10%] top-[16%] h-[54%] w-[18%] min-w-[210px] rounded-[2.2rem] border-[10px] border-[#101827] bg-[#dff7ec] p-4 shadow-[0_40px_100px_rgba(0,0,0,.42)] hero-float-b">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#101827]/60" />
          <p className="text-xs font-bold text-[#0f5b43]">MediEase Reminder</p>
          <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-[#14372c] shadow-sm">
            <p className="text-sm font-semibold">Follow-up tomorrow</p>
            <p className="mt-1 text-xs">10:30 AM with Dr. Mehta</p>
          </div>
          <div className="mt-3 rounded-2xl bg-[#1fbf75] px-4 py-3 text-white">
            <p className="text-sm font-semibold">Confirm appointment</p>
          </div>
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-[#14372c]">
            <p className="text-sm">Reschedule</p>
          </div>
        </div>
      ) : (
        <div className="absolute right-[8%] top-[20%] h-[33%] w-[26%] rounded-[2rem] border border-white/12 bg-white/[0.06] shadow-[0_35px_90px_rgba(0,0,0,.28)] hero-float-b">
          <div className="absolute left-[12%] top-[17%] h-16 w-16 rounded-full bg-[#d3a184]" />
          <div className="absolute left-[7%] top-[39%] h-28 w-24 rounded-t-[2.4rem] bg-[#ecf3f2]" />
          <div className="absolute right-[12%] top-[23%] h-14 w-14 rounded-full bg-[#9d7a64]" />
          <div className="absolute right-[7%] top-[44%] h-24 w-28 rounded-t-[2.4rem] bg-[#224a5b]" />
          <div className="absolute bottom-[18%] left-[21%] h-16 w-[58%] rounded-t-2xl border border-white/15 bg-[#0d1520]" />
        </div>
      )}
    </div>
  );
}

function EnglishScreen({ current }: { current: HeroWorkflow }) {
  const content = getScreenContent(current.scene);

  return (
    <div className="absolute left-1/2 top-[52%] w-[min(78vw,880px)] -translate-x-1/2 -translate-y-1/2">
      <div className="relative rounded-[2rem] border border-white/18 bg-[#0b1320]/95 p-4 shadow-[0_45px_140px_rgba(0,0,0,.48)]">
        <div className="absolute inset-x-8 top-0 h-[2px] rounded-full" style={{ background: current.tint }} />
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
            <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
            <span className="h-3 w-3 rounded-full bg-[#5ee39b]" />
          </div>
          <p className="text-xs font-medium text-white/55">MediEase Clinic Console · English</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.25fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: current.tint }}>
              {content.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white md:text-5xl">
              {content.heading}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{content.summary}</p>
            <div className="mt-6 flex gap-2">
              {content.metrics.map((metric) => (
                <div key={metric.label} className="flex-1 rounded-xl bg-white/[0.06] p-3">
                  <p className="text-lg font-bold text-white">{metric.value}</p>
                  <p className="mt-1 text-[10px] text-white/50">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[330px] overflow-hidden rounded-2xl border border-white/10 bg-[#101a28] p-5">
            <div className="hero-scan pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/12 to-transparent" />
            <div className="grid gap-3">
              {content.rows.map((row, index) => (
                <div
                  key={row.title}
                  className="rounded-xl border border-white/10 bg-white/[0.055] p-4"
                  style={{ transform: `translateX(${index % 2 === 0 ? 0 : 18}px)` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{row.title}</p>
                    <span
                      className="hero-pulse h-2.5 w-2.5 rounded-full"
                      style={{ background: row.statusColor ?? current.tint }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/62">{row.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-5 w-[72%] rounded-b-[2rem] bg-[#050b12] shadow-[0_18px_60px_rgba(0,0,0,.5)]" />
    </div>
  );
}

function getScreenContent(scene: HeroWorkflow["scene"]) {
  type ScreenContent = {
    eyebrow: string;
    heading: string;
    summary: string;
    metrics: { value: string; label: string }[];
    rows: { title: string; detail: string; statusColor?: string }[];
  };

  const content: Record<HeroWorkflow["scene"], ScreenContent> = {
    notes: {
      eyebrow: "Clinical Notes",
      heading: "Visit note drafted live",
      summary: "The consultation becomes structured English clinical notes while the doctor speaks.",
      metrics: [
        { value: "Live", label: "Listening" },
        { value: "SOAP", label: "Format" },
      ],
      rows: [
        { title: "Chief Complaint", detail: "Fever, sore throat and mild cough for two days." },
        { title: "Assessment", detail: "Likely viral upper respiratory infection. No red flag symptoms." },
        { title: "Plan", detail: "Fluids, rest, paracetamol if needed, review if fever persists." },
      ],
    },
    history: {
      eyebrow: "Patient History",
      heading: "Past care appears instantly",
      summary: "All visits, medicines, allergies and reports remain readable in one longitudinal record.",
      metrics: [
        { value: "12", label: "Visits" },
        { value: "0", label: "Allergies" },
      ],
      rows: [
        { title: "Last Visit", detail: "12 Jun 2026 · Blood pressure review completed." },
        { title: "Current Medicines", detail: "Amlodipine 5 mg once daily after breakfast." },
        { title: "Recent Lab", detail: "HbA1c 6.7%, lipid profile within target range." },
      ],
    },
    workflows: {
      eyebrow: "Workflows",
      heading: "Clinic work moves step by step",
      summary: "Check-in, vitals, consult, billing and follow-up stay visible to the whole team.",
      metrics: [
        { value: "5", label: "Steps" },
        { value: "On", label: "Track" },
      ],
      rows: [
        { title: "Check-in", detail: "Patient registered and token assigned at front desk.", statusColor: "#86F1C5" },
        { title: "Vitals", detail: "Nurse records BP, pulse, temperature and weight.", statusColor: "#7CE7FF" },
        {
          title: "Consult",
          detail: "Doctor opens record, listens, prescribes and closes visit.",
          statusColor: "#FFB088",
        },
      ],
    },
    rx: {
      eyebrow: "e-Prescriptions",
      heading: "Prescription ready in English",
      summary: "Medicines, dosage and instructions are clear before the Rx is sent to the patient.",
      metrics: [
        { value: "Rx", label: "Ready" },
        { value: "Sent", label: "Saved" },
      ],
      rows: [
        { title: "Medicine", detail: "Tab Paracetamol 500 mg · One tablet after food." },
        { title: "Duration", detail: "Take for three days. Do not exceed prescribed dose." },
        { title: "Advice", detail: "Drink warm fluids and return if breathing difficulty develops." },
      ],
    },
    queues: {
      eyebrow: "Queues",
      heading: "Waiting room stays calm",
      summary: "Tokens, room assignment and next patient status update without manual shouting.",
      metrics: [
        { value: "A-14", label: "Serving" },
        { value: "12m", label: "Wait" },
      ],
      rows: [
        { title: "Now Serving", detail: "Token A-14 · Consultation Room 2." },
        { title: "Next Patients", detail: "A-15, A-16 and A-17 are waiting." },
        { title: "Front Desk", detail: "New walk-in registered and added to queue." },
      ],
    },
    reminders: {
      eyebrow: "Reminders",
      heading: "Follow-up message delivered",
      summary: "Patients receive clear English reminders and can confirm or reschedule quickly.",
      metrics: [
        { value: "10:30", label: "Tomorrow" },
        { value: "Seen", label: "Status" },
      ],
      rows: [
        { title: "Message", detail: "Your follow-up visit is tomorrow at 10:30 AM." },
        { title: "Patient Reply", detail: "Confirmed. I will arrive 10 minutes early." },
        { title: "Clinic Status", detail: "Appointment confirmed and calendar updated." },
      ],
    },
    followups: {
      eyebrow: "Follow-Ups",
      heading: "Care continues after the visit",
      summary: "Reviews, reports and missed appointments are tracked after the patient leaves.",
      metrics: [
        { value: "3", label: "Tasks" },
        { value: "92%", label: "Done" },
      ],
      rows: [
        { title: "Tomorrow", detail: "Blood pressure review scheduled at 10:30 AM." },
        { title: "Friday", detail: "Upload fasting blood sugar report before noon." },
        { title: "Next Week", detail: "Doctor review after seven days of medicine." },
      ],
    },
    insights: {
      eyebrow: "Insights",
      heading: "Clinic patterns become visible",
      summary: "Operational and care insights help the team act before small issues grow.",
      metrics: [
        { value: "18", label: "Visits" },
        { value: "Low", label: "Risk" },
      ],
      rows: [
        { title: "Average Wait Time", detail: "12 minutes today, down 18% from last week." },
        { title: "No-show Risk", detail: "Low for confirmed follow-up patients." },
        { title: "Care Gap", detail: "Two diabetes reviews need lab report reminders." },
      ],
    },
    records: {
      eyebrow: "Lifelong Records",
      heading: "One story across every visit",
      summary: "Every note, Rx, report and reminder remains attached to the patient timeline.",
      metrics: [
        { value: "360°", label: "View" },
        { value: "Safe", label: "Access" },
      ],
      rows: [
        { title: "Visits", detail: "Consult notes, diagnoses and advice from each appointment." },
        { title: "Reports", detail: "Lab results and imaging summaries stored by date." },
        { title: "Prescriptions", detail: "All medicines and dosage instructions remain searchable." },
      ],
    },
  };

  return content[scene];
}

function FlowMarquee() {
  const [paused, setPaused] = useState(false);
  const track = [...scenes, ...scenes];

  return (
    <section className="relative z-10 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-5xl">
            From first visit to final follow-up
          </h2>
        </div>

        <div className="relative mt-14" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
            style={{
              background: "linear-gradient(to right, color-mix(in oklab, var(--bone) 92%, transparent), transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
            style={{
              background: "linear-gradient(to left, color-mix(in oklab, var(--bone) 92%, transparent), transparent)",
            }}
          />

          <div className="relative overflow-hidden">
            <div className={`marquee-x flex w-max gap-6 py-6 ${paused ? "marquee-paused" : ""}`}>
              {track.map((s, i) => (
                <SceneCard key={`${s.eyebrow}-${i}`} scene={s} eager={i === 0} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SceneCard({ scene, eager }: { scene: Scene; eager?: boolean }) {
  return (
    <article className="group relative w-[300px] shrink-0 sm:w-[340px]">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] border border-white/40 bg-card shadow-[0_30px_70px_-40px_rgba(15,40,50,0.45)] transition-transform duration-500 group-hover:-translate-y-1">
        <img
          src={scene.image}
          alt={scene.eyebrow}
          width={680}
          height={850}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            background: `linear-gradient(160deg, color-mix(in oklab, ${scene.accent} 22%, transparent), transparent 55%)`,
          }}
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/85 px-2.5 py-1 backdrop-blur">
          <img src={ASSETS.logo} alt="" className="h-6 w-6" />
          <span className="text-[11px] font-medium tracking-tight text-foreground">
            MediEase <span className="text-foreground/55">· {scene.eyebrow}</span>
          </span>
        </div>
      </div>

      <div className="mt-5 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: scene.accent }}>
          {scene.eyebrow}
        </p>
        <h3 className="mt-2 font-display text-[1.55rem] leading-[1.1] tracking-tight text-foreground">{scene.title}</h3>
        <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-foreground/65">{scene.body}</p>
      </div>
    </article>
  );
}