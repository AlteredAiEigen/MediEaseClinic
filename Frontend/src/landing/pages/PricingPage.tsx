import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/landing/components/SiteHeader";
import { openDemoDrawer } from "@/landing/components/DemoDrawer";
import { openSalesDrawer } from "@/landing/components/SalesDrawer";
import { Check, Building2, Network, Stethoscope, ShieldCheck, ArrowRight, Minus } from "lucide-react";

const CREAM = "#faf7f2";
const PLUM_DEEP = "#2a0a18";
const PLUM_INK = "#3a0a1f";
const BLUE_SKY = "#c9d6f5";
const BUTTER = "#f5e58a";
const TEAL = "#3aa8a0";

type Plan = {
  key: string;
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  highlight?: boolean;
  ctaLabel: string;
  ctaKind: "signup" | "trial" | "sales";
  features: string[];
  icon: typeof Stethoscope;
  accent: string;
};

const plans: Plan[] = [
  {
    key: "payg",
    name: "Pay as you go",
    tagline: "For solo doctors & small practices testing the water.",
    price: "₹20",
    priceSuffix: "per 15–20 min consult",
    ctaLabel: "Start consulting",
    ctaKind: "signup",
    icon: Stethoscope,
    accent: BLUE_SKY,
    features: [
      "₹20 per consultation (typical 15–20 min visit)",
      "Auto-drafted consultation summary",
      "e-Prescription with print, WhatsApp & email",
      "Patient intelligence chat (RAG)",
      "No minimums, no monthly fee",
      "Billed monthly against usage",
    ],
  },
  {
    key: "license",
    name: "Clinic License",
    tagline: "One flat license for a clinic or hospital department.",
    price: "Custom",
    priceSuffix: "annual license",
    highlight: true,
    ctaLabel: "Start 14-day free trial",
    ctaKind: "trial",
    icon: Building2,
    accent: BUTTER,
    features: [
      "Unlimited ambient transcription & consultations",
      "Multi-doctor & multi-room support",
      "Role-based access (Admin / Doctor / Reception)",
      "Branded prescription templates",
      "Priority onboarding & training",
      "After trial — request a paid pilot",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    tagline: "For hospital networks and multi-city groups.",
    price: "Let’s talk",
    priceSuffix: "volume agreement",
    ctaLabel: "Talk to sales",
    ctaKind: "sales",
    icon: Network,
    accent: "#d6c9f5",
    features: [
      "Everything in Clinic License",
      "Unlimited transcription across the network",
      "Network-wide deployment & SSO",
      "Custom integrations (HIS / EMR / LIS)",
      "Dedicated success manager",
      "Custom SLAs & data residency",
    ],
  },
];

const features: { section: string; rows: { label: string; values: [boolean | string, boolean | string, boolean | string] }[] }[] = [
  {
    section: "Clinical workflow",
    rows: [
      { label: "Ambient AI consultations", values: ["₹20 / consult", "Unlimited", "Unlimited"] },
      { label: "Auto consultation summary", values: [true, true, true] },
      { label: "e-Prescription (print / WhatsApp / email)", values: [true, true, true] },
      { label: "Patient intelligence chat (RAG)", values: [true, true, true] },
      { label: "Templates & specialty packs", values: ["Standard", "Branded", "Custom"] },
    ],
  },
  {
    section: "Team & access",
    rows: [
      { label: "Doctors included", values: ["1", "Unlimited", "Unlimited"] },
      { label: "Reception & admin roles", values: [false, true, true] },
      { label: "Single sign-on (SSO)", values: [false, false, true] },
    ],
  },
  {
    section: "Support & security",
    rows: [
      { label: "Support", values: ["Email", "Priority", "Dedicated CSM"] },
      { label: "HIPAA & NHA aligned", values: [true, true, true] },
      { label: "Custom SLA & data residency", values: [false, false, true] },
    ],
  },
];

// Volume tiers — pay-as-you-go base ₹20/consult, scale-down for committed volumes.
const tiers = [
  { consults: 50, payment: 1000, rate: 20.0 },
  { consults: 250, payment: 4500, rate: 18.0 },
  { consults: 600, payment: 9600, rate: 16.0 },
  { consults: 1500, payment: 21000, rate: 14.0 },
  { consults: 3500, payment: 45500, rate: 13.0 },
  { consults: 8000, payment: 96000, rate: 12.0 },
];

const faqs = [
  {
    q: "How does pay-as-you-go billing work?",
    a: "You're billed ₹20 per completed consultation at the end of every month. No minimums, no setup fee — cancel anytime.",
  },
  {
    q: "What's included in the 14-day free trial?",
    a: "Full access to the Clinic License plan — unlimited consultations, all roles, branded prescriptions and priority onboarding. After 14 days you can request a paid pilot.",
  },
  {
    q: "Can I switch from Pay as you go to a Clinic License later?",
    a: "Yes. Your history, templates and patient context move with you. Most clinics switch once they cross ~400 consultations a month.",
  },
  {
    q: "Is my patient data safe?",
    a: "MediEase is HIPAA-aligned, NHA-aligned and hosted on AWS with encryption in transit and at rest. Audio is processed in memory and never persisted.",
  },
  {
    q: "Do you support multi-location hospital networks?",
    a: "Yes — the Enterprise plan covers network-wide deployment, SSO, HIS/EMR integrations and dedicated success management.",
  },
  {
    q: "Can I get an invoice with GST?",
    a: "Absolutely. Every plan includes GST-compliant invoicing for Indian practices and clinics.",
  },
];

export function PricingPage() {
  return (
    <div style={{ background: CREAM, color: PLUM_INK }} className="min-h-screen">
      <div style={{ background: "#ffffff" }}>
        <SiteHeader variant="light" />
      </div>
      <Hero />
      <PlansGrid />
      <VolumeCalculator />
      <ComparisonTable />
      <FAQ />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="px-6 pt-16 pb-10 lg:pt-24 lg:pb-14">
      <div className="mx-auto max-w-4xl text-center">
        <h1
          className="mt-6 font-display text-5xl leading-[1.05] tracking-tight lg:text-6xl"
          style={{ color: PLUM_DEEP }}
        >
          Pricing that scales with{" "}
          <span style={{ fontStyle: "italic", fontFamily: "'Instrument Serif', serif" }}>your practice.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base lg:text-lg" style={{ color: `${PLUM_INK}B3` }}>
          Pay per consultation, license a clinic, or roll out across a hospital network — pick what fits today and grow into the next plan when you're ready.
        </p>
      </div>
    </section>
  );
}

function PlansGrid() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <PlanCard key={p.key} plan={p} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const navigate = useNavigate();
  const Icon = plan.icon;
  const isHighlight = plan.highlight;
  const cardBg = isHighlight ? PLUM_DEEP : "#ffffff";
  const textColor = isHighlight ? "#ffffff" : PLUM_INK;
  const subColor = isHighlight ? "#ffffffB3" : `${PLUM_INK}B3`;

  const onClick = () => {
    if (plan.ctaKind === "signup") {
      navigate("/signup");
      return;
    }
    if (plan.ctaKind === "sales") {
      openSalesDrawer({ intent: "enterprise" });
      return;
    }
    openDemoDrawer();
  };

  return (
    <div
      className="relative flex flex-col rounded-3xl p-8 shadow-sm transition-transform hover:-translate-y-1"
      style={{ background: cardBg, border: `1px solid ${isHighlight ? "transparent" : PLUM_INK + "15"}` }}
    >
      {isHighlight && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: BUTTER, color: PLUM_DEEP }}
        >
          Most popular
        </span>
      )}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: plan.accent, color: PLUM_DEEP }}
      >
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <h3 className="mt-5 font-display text-2xl" style={{ color: textColor }}>
        {plan.name}
      </h3>
      <p className="mt-2 text-sm" style={{ color: subColor }}>
        {plan.tagline}
      </p>
      <div className="mt-6 flex items-end gap-2">
        <span className="font-display text-5xl tracking-tight" style={{ color: textColor }}>
          {plan.price}
        </span>
        <span className="pb-2 text-sm" style={{ color: subColor }}>
          {plan.priceSuffix}
        </span>
      </div>
      <ul className="mt-6 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm" style={{ color: textColor }}>
            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: isHighlight ? BUTTER : TEAL }} strokeWidth={3} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        style={{
          background: isHighlight ? BUTTER : PLUM_DEEP,
          color: PLUM_DEEP,
        }}
      >
        {!isHighlight ? <span style={{ color: "#fff" }}>{plan.ctaLabel}</span> : plan.ctaLabel}
        <ArrowRight className="h-4 w-4" style={{ color: isHighlight ? PLUM_DEEP : "#fff" }} />
      </button>
    </div>
  );
}

function VolumeCalculator() {
  const [idx, setIdx] = useState(0);
  const tier = tiers[idx];
  const baseRate = 20;
  const savings = useMemo(() => Math.max(0, Math.round(((baseRate - tier.rate) / baseRate) * 100)), [tier]);
  const totalConsults = tier.consults;

  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <div
          className="rounded-3xl p-8 lg:p-12 shadow-xl"
          style={{ background: PLUM_DEEP, color: "#fff" }}
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h3 className="font-display text-2xl lg:text-3xl">Volume-based pricing</h3>
              <p className="mt-2 max-w-xl text-sm" style={{ color: "#ffffffB3" }}>
                See pricing for clinics that commit to a fixed monthly consultation volume — the per-consult rate drops as your volume grows.
              </p>
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-right"
              style={{ background: "#ffffff10", border: "1px solid #ffffff20" }}
            >
              <div className="text-[11px] uppercase tracking-wider" style={{ color: "#ffffff99" }}>
                Standard rate
              </div>
              <div className="font-display text-2xl">₹20.00 <span className="text-sm font-sans" style={{ color: "#ffffffB3" }}>/ consult</span></div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Consultations / mo" value={tier.consults.toLocaleString("en-IN")} />
            <Metric label="Effective rate" value={`₹${tier.rate.toFixed(2)}`} />
            <Metric label="You save" value={idx === 0 ? "—" : `₹${Math.round((20 - tier.rate) * tier.consults).toLocaleString("en-IN")}`} />
            <Metric label="Clinician hours saved" value={`${Math.round((tier.consults * 4) / 60).toLocaleString("en-IN")} hrs`} highlight />
          </div>

          <div className="mt-10">
            <input
              type="range"
              min={0}
              max={tiers.length - 1}
              step={1}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="w-full accent-white"
              style={{ accentColor: TEAL }}
            />
            <div className="mt-3 grid grid-cols-6 text-center text-xs" style={{ color: "#ffffff80" }}>
              {tiers.map((t, i) => (
                <button
                  key={t.consults}
                  onClick={() => setIdx(i)}
                  className="cursor-pointer transition-colors"
                  style={{ color: i === idx ? TEAL : "#ffffff80", fontWeight: i === idx ? 600 : 400 }}
                >
                  {t.consults >= 1000 ? `${t.consults / 1000}K` : t.consults}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-xs" style={{ color: "#ffffffB3" }}>
              <span>₹20.00 / consult (start)</span>
              <span>Savings: {savings}%</span>
              <span>₹{tier.rate.toFixed(2)} / consult (your tier)</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#ffffff15" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(idx / (tiers.length - 1)) * 100}%`, background: TEAL }} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5" style={{ background: "#ffffff08", border: "1px solid #ffffff15" }}>
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "#ffffff80" }}>
                You commit to
              </div>
              <div className="font-display text-xl">{totalConsults.toLocaleString("en-IN")} consultations / month</div>
            </div>
            <button
              onClick={() => openSalesDrawer({ intent: "volume", tierConsults: tier.consults, tierRate: tier.rate })}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: BUTTER, color: PLUM_DEEP }}
            >
              Lock in this rate <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: highlight ? "#ffffff15" : "#ffffff08", border: `1px solid ${highlight ? TEAL + "60" : "#ffffff15"}` }}
    >
      <div className="text-[11px] uppercase tracking-wider" style={{ color: "#ffffff80" }}>
        {label}
      </div>
      <div className="font-display text-xl" style={{ color: highlight ? TEAL : "#fff" }}>
        {value}
      </div>
    </div>
  );
}

function ComparisonTable() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-display text-3xl lg:text-4xl tracking-tight" style={{ color: PLUM_DEEP }}>
            Compare every feature
          </h2>
          <p className="mt-3 text-sm" style={{ color: `${PLUM_INK}B3` }}>
            Same calm product everywhere — extra controls unlock as your team grows.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${PLUM_INK}15` }}>
          <div className="grid grid-cols-4 gap-4 px-6 py-5 text-sm font-semibold" style={{ background: "#f3eee5", color: PLUM_DEEP }}>
            <div>Feature</div>
            <div className="text-center">Pay as you go</div>
            <div className="text-center">Clinic License</div>
            <div className="text-center">Enterprise</div>
          </div>
          {features.map((group) => (
            <div key={group.section}>
              <div className="px-6 pt-6 pb-2 text-xs uppercase tracking-wider" style={{ color: `${PLUM_INK}80` }}>
                {group.section}
              </div>
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-4 gap-4 px-6 py-4 text-sm items-center"
                  style={{ borderTop: `1px solid ${PLUM_INK}10` }}
                >
                  <div style={{ color: PLUM_INK }}>{row.label}</div>
                  {row.values.map((v, i) => (
                    <div key={i} className="text-center">
                      <Cell value={v} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4" style={{ color: TEAL }} strokeWidth={3} />;
  if (value === false) return <Minus className="mx-auto h-4 w-4" style={{ color: `${PLUM_INK}40` }} />;
  return <span className="text-xs font-medium" style={{ color: PLUM_INK }}>{value}</span>;
}

function FAQ() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="font-display text-3xl lg:text-4xl tracking-tight" style={{ color: PLUM_DEEP }}>
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl bg-white" style={{ border: `1px solid ${PLUM_INK}15` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-medium" style={{ color: PLUM_DEEP }}>{q}</span>
        <span className="text-xl leading-none" style={{ color: PLUM_DEEP }}>{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm" style={{ color: `${PLUM_INK}B3` }}>
          {a}
        </div>
      )}
    </div>
  );
}

function ClosingCTA() {
  return (
    <section className="px-6 pb-24">
      <div
        className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-8 py-16 lg:px-16 lg:py-20 text-center relative"
        style={{
          background: `linear-gradient(135deg, ${BLUE_SKY} 0%, #e8e2b8 100%)`,
          color: PLUM_DEEP,
        }}
      >
        <div className="relative z-10">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
            style={{ background: "#ffffff80", color: PLUM_DEEP }}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> HIPAA & NHA aligned · Hosted on AWS
          </span>
          <h2 className="mt-6 font-display text-4xl lg:text-5xl tracking-tight">
            Not sure which plan fits?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: `${PLUM_INK}CC` }}>
            Tell us how your clinic runs today — we'll suggest the smallest plan that covers it and grow with you from there.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openDemoDrawer}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: PLUM_DEEP, color: "#fff" }}
            >
              Book a personalised demo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}