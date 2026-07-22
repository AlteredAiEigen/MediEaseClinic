import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight, Linkedin } from "lucide-react";
import { ASSETS } from "@/landing/assets/assets";

const PLUM_DEEP = "#2a0a18";
const CREAM = "#ffffff";
const CREAM_DEEP = "#f4f6fa";
const INK_SOFT = "rgba(42,10,24,0.72)";
const INK_MUTE = "rgba(42,10,24,0.55)";
const HAIR = "rgba(42,10,24,0.12)";

const product = [
  { label: "How it works", to: "/how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "Safety", to: "/safety" },
  { label: "Login", to: "/login" },
];

const company = [
  { label: "Contact us", to: "/contact" },
  { label: "Privacy policy", to: "/privacy-policy" },
  { label: "Terms of service", to: "/terms-of-service" },
];

export function SiteFooter() {
  return (
    <footer style={{ background: CREAM, color: PLUM_DEEP }} className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full"
        style={{ background: `radial-gradient(circle, ${CREAM_DEEP}, transparent 65%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(201,214,245,0.35), transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="flex items-center gap-2">
              <img src={ASSETS.logo} alt="MediEase" className="h-12 w-12" />
              <span className="font-display text-2xl font-bold tracking-tight" style={{ color: PLUM_DEEP }}>MediEase</span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: INK_SOFT }}>
              The calm, connected workspace for modern clinics — ambient AI consultations, smart prescriptions and patient intelligence, built for India and engineered to global standards.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {["HIPAA aligned", "NHA aligned", "Hosted on AWS"].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider"
                  style={{ background: "rgba(42,10,24,0.04)", color: INK_SOFT, border: `1px solid ${HAIR}` }}
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <SocialLink href="https://www.linkedin.com/company/medieaseclinic/" label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-4 lg:grid-cols-2">
            <FooterColumn title="Product" items={product} />
            <FooterColumn title="Company" items={company} />
          </div>

          <div className="lg:col-span-3">
            <div
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${HAIR}` }}
            >
              <div className="text-xs uppercase tracking-wider" style={{ color: INK_MUTE }}>
                Talk to us
              </div>
              <Link
                to="/contact"
                className="mt-4 flex items-start gap-3 text-sm transition-opacity hover:opacity-100"
                style={{ color: PLUM_DEEP }}
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PLUM_DEEP }} />
                <span>alteredai@alteredai.care</span>
              </Link>
              <Link
                to="/contact"
                className="mt-3 flex items-start gap-3 text-sm transition-opacity hover:opacity-100"
                style={{ color: PLUM_DEEP }}
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PLUM_DEEP }} />
                <span>Reach our team</span>
              </Link>
              <div className="mt-3 flex items-start gap-3 text-sm" style={{ color: INK_SOFT }}>
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PLUM_DEEP }} />
                <span>Jammu, India — 180003</span>
              </div>
              <Link
                to="/contact"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                style={{ background: PLUM_DEEP, color: CREAM }}
              >
                Contact us <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center"
          style={{ borderColor: HAIR, color: INK_MUTE }}
        >
          <div>© {new Date().getFullYear()} MediEase. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:opacity-100" style={{ color: INK_SOFT }}>Privacy</Link>
            <Link to="/terms-of-service" className="hover:opacity-100" style={{ color: INK_SOFT }}>Terms</Link>
            <Link to="/contact" className="hover:opacity-100" style={{ color: INK_SOFT }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider" style={{ color: INK_MUTE }}>
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="transition-opacity hover:opacity-100" style={{ color: INK_SOFT }}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      style={{ background: "rgba(42,10,24,0.05)", color: INK_SOFT, border: `1px solid ${HAIR}` }}
    >
      {children}
    </a>
  );
}
