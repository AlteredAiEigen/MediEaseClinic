import { useState } from "react";
import { SiteHeader } from "@/landing/components/SiteHeader";
import { Mail, Phone, MapPin, Clock, Send, ArrowRight } from "lucide-react";
import { openDemoDrawer } from "@/landing/components/DemoDrawer";
import { submitContactInquiry } from "@/landing/lib/submitContact";

const CREAM = "#faf7f2";
const PLUM_DEEP = "#2a0a18";
const PLUM_INK = "#3a0a1f";
const BLUE_SKY = "#c9d6f5";
const BUTTER = "#f5e58a";

export function ContactPage() {
  return (
    <div style={{ background: CREAM, color: PLUM_INK }} className="min-h-screen">
      <div style={{ background: "#ffffff" }}>
        <SiteHeader variant="light" />
      </div>
      <Hero />
      <Body />
    </div>
  );
}

function Hero() {
  return (
    <section className="px-6 pt-16 pb-10 lg:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide"
          style={{ background: "#ffffff", color: PLUM_INK, border: `1px solid ${PLUM_INK}20` }}
        >
          Get in touch
        </span>
        <h1
          className="mt-6 font-display text-5xl leading-[1.05] tracking-tight lg:text-6xl"
          style={{ color: PLUM_DEEP }}
        >
          Let's transform healthcare{" "}
          <span style={{ fontStyle: "italic", fontFamily: "'Instrument Serif', serif" }}>together.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base lg:text-lg" style={{ color: `${PLUM_INK}B3` }}>
          Questions, demos or partnerships — our team usually replies within one working day.
        </p>
      </div>
    </section>
  );
}

function Body() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5">
        <ContactForm />
        <ContactSidebar />
      </div>
    </section>
  );
}

const emptyContactForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  subject: "",
  message: "",
};

function ContactForm() {
  const [form, setForm] = useState(emptyContactForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const message = [
      `Subject: ${form.subject.trim()}`,
      `Organization: ${form.organization.trim()}`,
      "",
      form.message.trim(),
    ].join("\n");

    try {
      await submitContactInquiry({
        name: fullName,
        email: form.email.trim(),
        phone: form.phone.trim() || "0000000000",
        message,
        providerName: form.organization.trim(),
      });
      setSubmitted(true);
      setForm(emptyContactForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 lg:col-span-3 lg:p-10" style={{ border: `1px solid ${PLUM_INK}15` }}>
      <h2 className="font-display text-2xl" style={{ color: PLUM_DEEP }}>
        Send us a message
      </h2>
      <p className="mt-2 text-sm" style={{ color: `${PLUM_INK}99` }}>
        Tell us a little about your clinic — we'll route you to the right person.
      </p>

      {submitted ? (
        <div
          className="mt-8 rounded-2xl p-6 text-center"
          style={{ background: `${BUTTER}40`, border: `1px solid ${PLUM_INK}20` }}
        >
          <div className="font-display text-xl" style={{ color: PLUM_DEEP }}>
            Thanks — we'll be in touch.
          </div>
          <p className="mt-2 text-sm" style={{ color: `${PLUM_INK}99` }}>
            Our team replies within one working day, usually faster.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name *">
              <input
                required
                className={inputClass}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </Field>
            <Field label="Last name *">
              <input
                required
                className={inputClass}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email *">
              <input
                required
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone *">
              <input
                required
                type="tel"
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Organization *">
            <input
              required
              className={inputClass}
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          </Field>
          <Field label="Subject *">
            <input
              required
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </Field>
          <Field label="Message *">
            <textarea
              required
              rows={5}
              className={inputClass}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: PLUM_DEEP, color: "#fff" }}
          >
            {submitting ? "Sending…" : "Send message"} <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-[#3a0a1f25] bg-[#faf7f2] px-4 py-3 text-sm text-[#3a0a1f] outline-none transition focus:border-[#2a0a18] focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: `${PLUM_INK}99` }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ContactSidebar() {
  return (
    <div className="space-y-4 lg:col-span-2">
      <InfoCard
        icon={Mail}
        title="Email us"
        subtitle="Get in touch via email"
        value="alteredai@alteredai.care"
        href="mailto:alteredai@alteredai.care"
        accent={BLUE_SKY}
      />
      <InfoCard
        icon={Phone}
        title="Call us"
        subtitle="Mon–Fri, 9am–6pm IST"
        value="+91 70065 90467"
        href="tel:+917006590467"
        accent={BUTTER}
      />
      <InfoCard icon={MapPin} title="Visit us" subtitle="Jammu, India" value="180003" accent="#d6c9f5" />
      <div className="rounded-2xl p-6" style={{ background: PLUM_DEEP, color: "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#ffffff15" }}>
            <Clock className="h-5 w-5" style={{ color: BUTTER }} />
          </div>
          <div className="font-display text-lg">Business hours</div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm" style={{ color: "#ffffffCC" }}>
          <li className="flex justify-between">
            <span>Mon – Fri</span>
            <span>9am – 6pm</span>
          </li>
          <li className="flex justify-between">
            <span>Saturday</span>
            <span>10am – 4pm</span>
          </li>
          <li className="flex justify-between">
            <span>Sunday</span>
            <span>Closed</span>
          </li>
        </ul>
        <button
          onClick={openDemoDrawer}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: BUTTER, color: PLUM_DEEP }}
        >
          Book a personalised demo <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  subtitle,
  value,
  href,
  accent,
}: {
  icon: typeof Mail;
  title: string;
  subtitle: string;
  value: string;
  href?: string;
  accent: string;
}) {
  const Wrapper: any = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="block rounded-2xl bg-white p-5 transition-transform hover:-translate-y-0.5"
      style={{ border: `1px solid ${PLUM_INK}15` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: accent, color: PLUM_DEEP }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-display text-base" style={{ color: PLUM_DEEP }}>
            {title}
          </div>
          <div className="text-xs" style={{ color: `${PLUM_INK}99` }}>
            {subtitle}
          </div>
          <div className="mt-1 text-sm font-medium" style={{ color: PLUM_INK }}>
            {value}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}