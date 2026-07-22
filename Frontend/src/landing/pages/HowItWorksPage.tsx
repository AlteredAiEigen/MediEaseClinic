import { Link } from "react-router-dom";
import { SiteHeader } from "@/landing/components/SiteHeader";
import { openDemoDrawer } from "@/landing/components/DemoDrawer";
import { ASSETS } from "@/landing/assets/assets";

import {
  Brain,
  Activity,
  ShieldCheck,
  Glasses,
  Check,
  Send,
  Sparkles,
  Pencil,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// Palette tuned to match the reference site, with MediEase's plum accent.
const CREAM = "#faf7f2";       // page background
const PLUM_DEEP = "#2a0a18";   // hero CTA + primary buttons
const PLUM_INK = "#3a0a1f";    // body text accent
const BLUE_SKY = "#c9d6f5";    // hero background
const BUTTER = "#f5e58a";      // accent highlight
const STEP_SURFACE = "#eef0f4"; // image card surface

type Step = {
  title: string;
  body: string;
  image: string;
  alt: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    title: "Ask for patient consent",
    body:
      "MediEase reminds you at the right moment, records consent, and applies privacy settings automatically so every consult begins on solid clinical ground.",
    image: ASSETS.howStep1,
    alt: "Clinician speaking to a screen showing a microphone, sound waves and a confirmation check.",
    icon: Check,
  },
  {
    title: "Add context that matters",
    body:
      "Add notes and observations. MediEase connects previous visits, letters, and reports to tailor the note perfectly to the patient in front of you.",
    image: ASSETS.howStep2,
    alt: "Context card linked to previous sessions, file attachments and a PDF document.",
    icon: Send,
  },
  {
    title: "Conduct the consult as usual",
    body:
      "You talk, MediEase listens — transcribing in real time, even in busy OPDs. It recognises multiple speakers and code-switches across regional languages with clinical precision.",
    image: ASSETS.howStep3,
    alt: "Microphone with an active audio signal above a transcript document.",
    icon: Sparkles,
  },
  {
    title: "Finalise your note in seconds",
    body:
      "MediEase turns the conversation into a complete clinical note. Review, edit, and finalise — and over time it learns your tone, templates, and style.",
    image: ASSETS.howStep4,
    alt: "A digital note form with Subjective, Objective and Assessment sections.",
    icon: Pencil,
  },
  {
    title: "Turn notes into next steps",
    body:
      "Letters, follow-ups, prescriptions and codes drafted in seconds. MediEase surfaces what matters next, so every patient leaves with a clear path forward.",
    image: ASSETS.howStep5,
    alt: "Task management interface with a New Task button and an empty task list.",
    icon: ArrowRight,
  },
];

type Intelligence = { icon: LucideIcon; title: string; body: string };

const intelligence: Intelligence[] = [
  {
    icon: Brain,
    title: "Learns your style",
    body:
      "Every word is shaped by your phrasing, templates, and tone. Over time, MediEase mirrors your clinical style, creating notes that feel uniquely yours.",
  },
  {
    icon: Activity,
    title: "Adapts to your speciality",
    body:
      "From family medicine to cardiology to allied health — MediEase recognises clinical nuance across specialities and subspecialties.",
  },
  {
    icon: ShieldCheck,
    title: "World-leading security",
    body:
      "Protected to the highest international privacy and data protection standards. Aligned with HIPAA and India's National Health Authority guidance.",
  },
  {
    icon: Glasses,
    title: "Deep clinical review",
    body:
      "Validated in practice to stay accurate, reliable, and clinically sound. Every update is reviewed by our medical team, adding the judgment automation alone can't provide.",
  },
];

export function HowItWorksPage() {
  return (
    <div style={{ background: CREAM }} className="min-h-screen text-foreground">
      <div className="bg-white">
        <SiteHeader variant="light" />
      </div>
      {/* ============ Header / Hero — light periwinkle blue, inset rounded card ============ */}
      <section className="px-3 pt-3 sm:px-5 lg:px-6 lg:pt-4" style={{ background: "#ffffff" }}>
        <div
          className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem]"
          style={{ background: BLUE_SKY }}
        >
          {/* Decorative line-art arcs - left */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -left-10 top-0 h-full w-[36%] opacity-70"
            viewBox="0 0 400 800"
            preserveAspectRatio="none"
            fill="none"
          >
            <path d="M-20 -20 Q 260 400 -20 820" stroke="#ffffff" strokeWidth="2" opacity="0.85" />
            <path d="M-80 -40 Q 320 400 -80 840" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <path d="M-140 -60 Q 380 400 -140 860" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
          </svg>
          {/* Decorative line-art arcs - right */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-full w-[36%] opacity-70"
            viewBox="0 0 400 800"
            preserveAspectRatio="none"
            fill="none"
          >
            <path d="M420 -20 Q 140 400 420 820" stroke="#ffffff" strokeWidth="2" opacity="0.85" />
            <path d="M480 -40 Q 80 400 480 840" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <path d="M540 -60 Q 20 400 540 860" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
          </svg>

          <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-16 text-center lg:px-10 lg:pb-28 lg:pt-24">
            <h1
              className="font-display text-[clamp(2.4rem,6.4vw,4.8rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ color: PLUM_INK }}
            >
              How MediEase works
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-lg"
              style={{ color: PLUM_INK, opacity: 0.78 }}
            >
              From the first word to the final note, MediEase is fast, secure, and designed
              around how you care.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3" />

          </div>
        </div>
      </section>


      {/* ============ Workflow steps — sticky left, scrolling right with timeline ============ */}
      <section className="py-20 lg:py-28" style={{ background: CREAM }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
            {/* Sticky left headline */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2
                className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-medium leading-[1.05] tracking-tight"
                style={{ color: PLUM_INK }}
              >
                Care that just
                <br />
                writes itself.
              </h2>
              <p className="mt-6 max-w-md text-lg" style={{ color: PLUM_INK, opacity: 0.72 }}>
                Every consult captured, connected, and completed without breaking your flow.
              </p>
              <Link
                to="/contact"
                className="mt-8 inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: PLUM_DEEP, color: BUTTER }}
              >
                Get MediEase
                <span aria-hidden>→</span>
              </Link>

            </div>

            {/* Right column — timeline + steps */}
            <ol className="relative space-y-20 lg:space-y-28">
              {/* Vertical timeline line */}
              <div
                className="pointer-events-none absolute left-[11px] top-0 hidden h-full lg:block"
                style={{ width: 1, background: "rgba(58,10,31,0.12)" }}
              />

              {steps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <li key={step.title} className="relative">
                    {/* Timeline icon */}
                    <div className="absolute left-0 top-0 hidden lg:flex">
                      <StepIcon
                        className="h-6 w-6"
                        strokeWidth={2.5}
                        style={{ color: PLUM_DEEP }}
                      />
                    </div>

                    {/* Content */}
                    <div className="lg:pl-10">
                      <h3
                        className="font-display text-2xl font-medium tracking-tight md:text-[1.75rem]"
                        style={{ color: PLUM_INK }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="mt-3 max-w-xl text-base leading-relaxed md:text-lg"
                        style={{ color: PLUM_INK, opacity: 0.72 }}
                      >
                        {step.body}
                      </p>
                      <div
                        className="mt-7 overflow-hidden rounded-[1.75rem] border"
                        style={{ background: STEP_SURFACE, borderColor: "rgba(58,10,31,0.08)" }}
                      >
                        <img
                          src={step.image}
                          alt={step.alt}
                          loading={i === 0 ? "eager" : "lazy"}
                          className="block h-auto w-full"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ============ Quiet intelligence — same cream canvas, simple cards ============ */}
      <section className="pb-24 pt-8 lg:pb-32" style={{ background: CREAM }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <h2
            className="text-center font-display text-[clamp(2rem,5vw,3.8rem)] font-medium leading-[1.08] tracking-[-0.01em]"
            style={{ color: PLUM_INK }}
          >
            What you don't see.
            <br />
            The quiet intelligence behind
            <br className="hidden sm:block" /> every conversation.
          </h2>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:gap-6">
            {intelligence.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[1.5rem] bg-white p-8 sm:p-10"
                  style={{ boxShadow: "0 1px 0 rgba(58,10,31,0.05)" }}
                >
                  <Icon
                    className="h-8 w-8"
                    strokeWidth={1.5}
                    style={{ color: PLUM_INK }}
                    aria-hidden
                  />
                  <h3
                    className="mt-8 font-display text-[1.65rem] font-medium leading-tight tracking-tight"
                    style={{ color: PLUM_INK }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-4 max-w-md text-[0.98rem] leading-relaxed"
                    style={{ color: PLUM_INK, opacity: 0.7 }}
                  >
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Closing CTA — deep plum with decorative line-art rings ============ */}
      <section className="px-3 pb-12 sm:px-5 lg:px-10 lg:pb-16" style={{ background: CREAM }}>
        <div
          className="relative overflow-hidden rounded-[2.5rem] px-6 py-20 text-center sm:py-24 lg:py-28"
          style={{ background: PLUM_DEEP }}
        >
          {/* Decorative interlocking rings */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -left-20 top-1/2 h-[120%] w-[40%] -translate-y-1/2 opacity-25"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle cx="120" cy="200" r="140" stroke="#f5e58a" strokeWidth="1.2" />
            <circle cx="220" cy="120" r="100" stroke="#f5e58a" strokeWidth="1.2" />
            <circle cx="220" cy="280" r="100" stroke="#f5e58a" strokeWidth="1.2" />
          </svg>
          <svg
            aria-hidden
            className="pointer-events-none absolute -right-20 top-1/2 h-[120%] w-[40%] -translate-y-1/2 opacity-25"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle cx="280" cy="200" r="140" stroke="#f5e58a" strokeWidth="1.2" />
            <circle cx="180" cy="120" r="100" stroke="#f5e58a" strokeWidth="1.2" />
            <circle cx="180" cy="280" r="100" stroke="#f5e58a" strokeWidth="1.2" />
          </svg>

          <div className="relative">
            <h2
              className="font-display text-[clamp(2rem,5vw,3.8rem)] font-medium leading-tight tracking-tight text-white"
            >
              Ready for your next consult.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">
              MediEase is free to start. Set it up in minutes and spend your time where it
              matters most.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={openDemoDrawer}
                className="inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: BUTTER, color: PLUM_INK }}
              >
                Book a demo
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              >
                Contact us <span aria-hidden>→</span>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}