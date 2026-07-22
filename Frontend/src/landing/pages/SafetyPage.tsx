import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ShieldCheck, FileText, Trash2, Lock, Sparkles, Mic } from "lucide-react";
import { SiteHeader } from "@/landing/components/SiteHeader";
import { ASSETS } from "@/landing/assets/assets";

const PLUM = "#3a0a1f";
const CREAM = "#f4ecd8";
const BUTTER = "#f5e58a";
const PERIWINKLE = "#bdd6f0";

// ---- Rotating compliance badges (HIPAA, NHA, AWS only) ----
const badges = [
  { src: ASSETS.logoHipaa, label: "HIPAA" },
  { src: ASSETS.logoNha, label: "National Health Authority" },
  { src: ASSETS.awsCertified, label: "AWS Secured" },
];

function BadgeMarquee() {
  const loop = [...badges, ...badges, ...badges, ...badges, ...badges, ...badges];
  return (
    <div className="relative overflow-hidden py-10" style={{ background: CREAM }}>
      <p
        className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: `${PLUM}99` }}
      >
        Ticking every compliance and safety box
      </p>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
        style={{ background: `linear-gradient(to right, ${CREAM}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
        style={{ background: `linear-gradient(to left, ${CREAM}, transparent)` }}
      />
      <div className="flex w-max marquee-x gap-16 px-8">
        {loop.map((b, i) => (
          <div key={i} className="flex h-16 w-32 shrink-0 items-center justify-center">
            <img
              src={b.src}
              alt={b.label}
              className="max-h-14 max-w-full object-contain"
              style={{ filter: "grayscale(100%)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Data lifecycle steps (replaces video illustrations with iconographic cards) ----
const lifecycle = [
  {
    icon: Mic,
    title: "As you consult, MediEase listens",
    body: "MediEase captures your consultation in real time, right from your browser or laptop microphone.",
    tint: PERIWINKLE,
    mockup: "listen" as const,
  },
  {
    icon: FileText,
    title: "Transcript: every detail, instantly transcribed",
    body: "Spoken words become accurate, structured text — ready for clinician review in seconds.",
    tint: "#e8e2b8",
    mockup: "transcript" as const,
  },
  {
    icon: Lock,
    title: "De-identification: privacy first",
    body: "MediEase automatically strips identifiable patient details from transcripts and generated notes.",
    tint: "#cfe6d6",
    mockup: "deid" as const,
  },
  {
    icon: Sparkles,
    title: "Medical notes & documents in minutes",
    body: "From the transcript, MediEase generates structured notes, referral letters, prescriptions and care plans.",
    tint: PERIWINKLE,
    mockup: "note" as const,
  },
  {
    icon: ShieldCheck,
    title: "Delete means delete — forever",
    body: "Once the note is transferred to your EHR, one tap removes everything. No silent backups.",
    tint: "#f0c8c8",
    mockup: "delete" as const,
  },
];

const bestPractices = [
  {
    title: "Empower your patients with consent",
    body: "There are many ways to ask for consent — choose the flow that works for you. MediEase can remind you at the start of every session from your settings.",
  },
  {
    title: "Remember to check your notes",
    body: "Once notes are generated, take a moment to review and add any extra detail or context before pushing them to your EHR.",
  },
  {
    title: "Share access responsibly",
    body: "Protect patient confidentiality by avoiding shared logins. Templates can be shared safely through our template library — and anyone can try MediEase free.",
  },
];

const faqs = [
  {
    q: "Can MediEase access my patient's information?",
    a: "No. Before MediEase processes your session, all data is stripped of personal identifiers, so it cannot be traced back to an individual. Your patient's data stays protected, and MediEase will never contact your patients.",
  },
  {
    q: "Are audio recordings saved?",
    a: "No. Audio is transcribed in real time and immediately discarded. Only the resulting transcript and notes are retained, and only for as long as you need them.",
  },
  {
    q: "Where are MediEase's servers storing my data?",
    a: "Patient data is stored on AWS infrastructure in compliant regions, encrypted at rest and in transit, with strict access controls aligned to HIPAA and India's National Health Authority guidelines.",
  },
  {
    q: "How does MediEase mitigate data breaches?",
    a: "We follow a defence-in-depth approach: encryption everywhere, least-privilege access, continuous monitoring, regular penetration tests and an incident-response runbook reviewed by our compliance team.",
  },
  {
    q: "How do you tackle 'hallucinations'?",
    a: "Our Medical Knowledge team continuously evaluates outputs against real clinical scenarios. Generated notes are always presented for clinician review before they reach the EHR — the clinician remains in charge.",
  },
  {
    q: "Does MediEase use my data to train its AI?",
    a: "No. Your transcripts, notes and uploads are never used to train our models. Improvements come from templates designed by our clinical team based on opt-in feedback.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t" style={{ borderColor: `${PLUM}22` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-6 text-left"
      >
        <span className="font-display text-xl sm:text-2xl" style={{ color: PLUM }}>
          {q}
        </span>
        <ChevronDown
          className="h-5 w-5 transition-transform"
          style={{ color: PLUM, transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <p className="pb-6 pr-10 text-base leading-relaxed" style={{ color: `${PLUM}CC` }}>
          {a}
        </p>
      )}
    </div>
  );
}

// Per-step product mockup illustrations for the data-lifecycle timeline.
type MockupKind = "listen" | "transcript" | "deid" | "note" | "delete";

function LifecycleMockup({ kind, tint }: { kind: MockupKind; tint: string }) {
  return (
    <div
      className="mt-6 aspect-[16/10] w-full overflow-hidden rounded-3xl p-6 shadow-[0_30px_80px_-50px_rgba(42,10,24,0.55)]"
      style={{ background: tint }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white p-5">
        {/* Faux window chrome */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f0c8c8]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e8e2b8]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#cfe6d6]" />
          <span className="ml-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${PLUM}66` }}>
            MediEase · Consultation
          </span>
        </div>

        {kind === "listen" && (
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c44a2a] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#c44a2a]" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: PLUM }}>
                Listening · 00:42
              </span>
              <span className="ml-auto text-[10px]" style={{ color: `${PLUM}99` }}>
                Mic · MacBook
              </span>
            </div>
            <div className="mt-auto flex h-20 items-center gap-1">
              {Array.from({ length: 48 }).map((_, k) => (
                <div
                  key={k}
                  className="flex-1 rounded-full"
                  style={{
                    height: `${15 + Math.abs(Math.sin(k * 0.7) * Math.cos(k * 0.3)) * 85}%`,
                    background: PLUM,
                    opacity: 0.35 + (k % 5) * 0.12,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px]" style={{ color: `${PLUM}88` }}>
              <span>00:00</span>
              <span>Pause ▍▍</span>
              <span>01:30</span>
            </div>
          </div>
        )}

        {kind === "transcript" && (
          <div className="flex flex-1 flex-col gap-2 text-[11px]" style={{ color: PLUM }}>
            <div className="flex gap-2">
              <span className="rounded-full bg-[#3a0a1f] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#f4ecd8]">Dr</span>
              <div className="flex-1 rounded-2xl rounded-tl-sm bg-[#f4ecd8] px-3 py-1.5">How long has the pain lasted?</div>
            </div>
            <div className="flex flex-row-reverse gap-2">
              <span className="rounded-full bg-[#bdd6f0] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: PLUM }}>Pt</span>
              <div className="flex-1 rounded-2xl rounded-tr-sm bg-[#eaf1fb] px-3 py-1.5">About three days, mostly evenings.</div>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-[#3a0a1f] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#f4ecd8]">Dr</span>
              <div className="flex-1 rounded-2xl rounded-tl-sm bg-[#f4ecd8] px-3 py-1.5">Any fever, nausea, or visual changes?</div>
            </div>
            <div className="flex flex-row-reverse gap-2">
              <span className="rounded-full bg-[#bdd6f0] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: PLUM }}>Pt</span>
              <div className="flex-1 rounded-2xl rounded-tr-sm bg-[#eaf1fb] px-3 py-1.5">A low fever last night. No vision issues.</div>
            </div>
            <div className="mt-auto flex items-center gap-2 text-[10px]" style={{ color: `${PLUM}88` }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c44a2a]" />
              Transcribing in real time…
            </div>
          </div>
        )}

        {kind === "deid" && (
          <div className="flex flex-1 flex-col gap-2 text-[11px]" style={{ color: PLUM }}>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${PLUM}99` }}>
              Patient record · de-identified
            </div>
            {[
              ["Name", "█████ █████"],
              ["Date of birth", "██/██/████"],
              ["MRN", "████-████"],
              ["Phone", "+91 ██████████"],
              ["Address", "███████████████"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-[#f7f1e0] px-3 py-1.5">
                <span>{k}</span>
                <span className="font-mono tracking-tight" style={{ color: PLUM }}>{v}</span>
              </div>
            ))}
            <div className="mt-auto flex items-center justify-between rounded-lg bg-[#cfe6d6] px-3 py-1.5">
              <span>Chief complaint</span>
              <span>Headache · 3 days</span>
            </div>
          </div>
        )}

        {kind === "note" && (
          <div className="flex flex-1 flex-col text-[11px]" style={{ color: PLUM }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-widest" style={{ color: `${PLUM}99` }}>
                SOAP note · draft
              </span>
              <span className="rounded-full bg-[#cfe6d6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest">
                Ready
              </span>
            </div>
            <div className="mt-3 space-y-1.5 leading-snug">
              <div><span className="font-semibold">S:</span> Patient reports 3-day frontal headache, worse evenings.</div>
              <div><span className="font-semibold">O:</span> Afebrile today. BP 128/82. Neuro exam unremarkable.</div>
              <div><span className="font-semibold">A:</span> Likely tension-type headache; rule out sinusitis.</div>
              <div><span className="font-semibold">P:</span> Hydration, analgesia, review in 5 days.</div>
            </div>
            <div className="mt-auto flex gap-2">
              <span className="rounded-full bg-[#f5e58a] px-3 py-1 text-[10px] font-semibold" style={{ color: PLUM }}>Copy to EHR →</span>
              <span className="rounded-full border px-3 py-1 text-[10px] font-semibold" style={{ borderColor: `${PLUM}44`, color: PLUM }}>Edit</span>
            </div>
          </div>
        )}

        {kind === "delete" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Trash2 className="h-8 w-8" style={{ color: "#c44a2a" }} />
            <div className="font-display text-2xl leading-tight" style={{ color: PLUM }}>
              Delete this consultation?
            </div>
            <div className="text-[11px]" style={{ color: `${PLUM}99` }}>
              Transcript, notes and uploads will be permanently removed.
            </div>
            <div className="flex gap-2">
              <div className="rounded-full border px-3 py-1 text-[10px] font-semibold" style={{ borderColor: `${PLUM}44`, color: PLUM }}>Cancel</div>
              <div className="rounded-full px-3 py-1 text-[10px] font-semibold" style={{ background: "#c44a2a", color: "#fff" }}>Delete forever</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SafetyPage() {
  return (
    <div style={{ background: CREAM, color: PLUM }}>
      {/* Top white header bar — matches home page alignment */}
      <div className="bg-white">
        <SiteHeader variant="light" />
      </div>
      {/* HERO — centered */}
      <div style={{ background: PERIWINKLE }}>
        <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-28 pt-24 text-center lg:px-10 lg:pb-40 lg:pt-32">
          <p className="font-display text-3xl italic sm:text-4xl" style={{ color: `${PLUM}AA` }}>
            This is your
          </p>
          <h1
            className="font-display text-7xl leading-[0.95] tracking-tight sm:text-8xl lg:text-[10rem]"
            style={{ color: PLUM }}
          >
            safe space
          </h1>
        </section>
      </div>

      {/* What does safety mean + intro — centered */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-10">
        <p className="font-display text-2xl italic sm:text-3xl" style={{ color: `${PLUM}99` }}>
          What does safety mean to us?
        </p>
        <h2 className="mt-6 font-display text-4xl leading-tight sm:text-5xl" style={{ color: PLUM }}>
          MediEase is built <em className="italic">with clinicians</em>, for clinicians
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed" style={{ color: `${PLUM}CC` }}>
          <p>
            We understand the privilege of handling sensitive personal information and we take it seriously.
            Guided by practising doctors and a dedicated compliance team, MediEase sits at the forefront of
            data safety for AI clinical workspaces in India and beyond — keeping your data secure at every step.
          </p>
          <p>
            Whatever your specialty, we've made MediEase both <strong>safe and joyful</strong> to use. Here's
            how we deliver on that promise — from how we handle audio, to how we prove our compliance posture.
          </p>
        </div>
      </section>

      {/* Compliance marquee */}
      <BadgeMarquee />

      {/* Your data is yours — single line */}
      <section className="mx-auto max-w-7xl px-6 pt-24 text-center lg:px-10">
        <h2
          className="font-display text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl"
          style={{ color: PLUM }}
        >
          <span style={{ color: `${PLUM}99` }} className="italic">Your data is </span>
          <em className="italic">yours</em>
        </h2>
      </section>

      {/* Sticky left + scrolling timeline right (Heidi-style) */}
      <section className="mx-auto max-w-6xl px-6 pb-32 pt-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          {/* Sticky left column */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h3 className="font-display text-3xl leading-tight sm:text-4xl" style={{ color: PLUM }}>
              What data does MediEase store?
            </h3>
            <p className="mt-5 text-base leading-relaxed" style={{ color: `${PLUM}CC` }}>
              MediEase only stores transcripts and notes — and that's it, for as long as you need them.
              As you speak, MediEase transcribes your words. No audio recordings are ever saved, ensuring
              there's no hidden playback.
            </p>
          </div>

          {/* Right timeline column */}
          <div className="relative">
            <div
              className="absolute bottom-2 left-3 top-2 w-px"
              style={{ background: `${PLUM}33` }}
            />
            <div className="space-y-20">
              {lifecycle.map((step, i) => (
                <div key={i} className="relative pl-12">
                  <div
                    className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center"
                    style={{ background: CREAM }}
                  >
                    <step.icon className="h-5 w-5" style={{ color: PLUM, strokeWidth: 2.25 }} />
                  </div>
                  <h4 className="font-display text-2xl leading-tight sm:text-3xl" style={{ color: PLUM }}>
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm font-medium" style={{ color: "#c44a2a" }}>
                    {step.body}
                  </p>
                  <LifecycleMockup kind={step.mockup} tint={step.tint} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* No training on your data — centered */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-10">
        <p className="font-display text-2xl italic" style={{ color: `${PLUM}99` }}>
          But how do you make it sound like me?
        </p>
        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl" style={{ color: PLUM }}>
          MediEase doesn't use any of your data to train our AI
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed" style={{ color: `${PLUM}CC` }}>
          <p>
            Every clinician has their own style and their own vision of the perfect note. Our Medical Knowledge
            team — skilled clinicians turned prompt engineers — designs hundreds of templates based on real
            clinical feedback so your notes sound like you, not like a generic AI.
          </p>
          <p>
            Need tweaks? Open your template, tell MediEase what you want and where you want it, and the change
            sticks. You're always in charge.
          </p>
        </div>
      </section>

      {/* Delete means delete — full-bleed feel, extended width */}
      <section
        className="mx-3 rounded-[2.5rem] px-8 py-24 text-center sm:px-16 lg:mx-10 lg:py-28"
        style={{ background: PLUM, color: CREAM }}
      >
        <h2 className="mx-auto max-w-5xl font-display text-5xl leading-tight sm:text-6xl lg:text-7xl">
          Delete means delete. <em className="italic" style={{ color: BUTTER }}>Forever.</em>
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed opacity-80">
          When you delete a consultation, transcript or note from MediEase, it is removed from active systems
          immediately and purged from encrypted backups within our documented retention window. No silent
          archives, no shadow copies.
        </p>
      </section>

      {/* Testimonial — hidden for now, can be re-enabled later */}
      {false && (
        <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: `${PLUM}99` }}>
            Everyone loves MediEase
          </p>
          <blockquote className="mt-6 font-display text-4xl leading-tight sm:text-5xl" style={{ color: PLUM }}>
            "I love how passionate you are about data governance and security. We feel we're in safe hands."
          </blockquote>
          <p className="mt-6 text-sm font-medium" style={{ color: `${PLUM}AA` }}>
            — Compliance Partner, multi-specialty clinic
          </p>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-24 lg:px-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: `${PLUM}99` }}
        >
          Quick answers
        </p>
        <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl" style={{ color: PLUM }}>
          MediEase Safety FAQs
        </h2>
        <div className="mt-10">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
          <div className="border-t" style={{ borderColor: `${PLUM}22` }} />
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: PLUM, color: CREAM }}
          >
            Back to home
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: BUTTER, color: PLUM }}
          >
            Talk to our compliance team →
          </Link>
        </div>
      </section>
    </div>
  );
}