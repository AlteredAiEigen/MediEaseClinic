import { } from "react-router-dom";
import { SiteHeader } from "@/landing/components/SiteHeader";

const CREAM = "#faf7f2";
const PLUM_DEEP = "#2a0a18";
const PLUM_INK = "#3a0a1f";

export function PrivacyPage() {
  return (
    <div style={{ background: CREAM, color: PLUM_INK }} className="min-h-screen">
      <div style={{ background: "#ffffff" }}>
        <SiteHeader variant="light" />
      </div>
      <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <p className="text-xs uppercase tracking-wider" style={{ color: `${PLUM_INK}80` }}>Legal</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight" style={{ color: PLUM_DEEP }}>
          Privacy policy
        </h1>
        <p className="mt-3 text-sm" style={{ color: `${PLUM_INK}99` }}>Last updated: December 24, 2025</p>

        <p className="mt-8 text-base leading-relaxed">
          At MediEase, your health data privacy is our top priority. We process personal and sensitive
          health information with enterprise-grade security, compliant with India's DPDP Act 2023, IT Act
          2000, and HIPAA-equivalent standards.
        </p>

        <Section title="1. Information we collect">
          <ul className="ml-5 list-disc space-y-2">
            <li><strong>Patient personal data:</strong> Name, phone, email, address during registration.</li>
            <li><strong>Health information:</strong> Symptoms, service preferences, appointment details.</li>
            <li><strong>Communication records:</strong> Message logs, opt-ins, delivery confirmations.</li>
            <li><strong>Clinic technical data:</strong> IP address, device info, usage patterns.</li>
          </ul>
        </Section>

        <Section title="2. How we use your data">
          <ul className="ml-5 list-disc space-y-2">
            <li>Schedule appointments and send WhatsApp / email notifications.</li>
            <li>Coordinate with partner clinics — patient data access only by doctors during consultation.</li>
            <li>Maintain compliance records and audit trails.</li>
            <li>No marketing or data resale without separate consent.</li>
          </ul>
        </Section>

        <Section title="3. Data storage & security">
          <ul className="ml-5 list-disc space-y-2">
            <li><strong>End-to-end encryption</strong> for all health records and communications.</li>
            <li><strong>HIPAA-equivalent standards:</strong> access controls, audit logging, secure deletion.</li>
            <li><strong>100% data privacy:</strong> no third-party sharing beyond clinics and legal requirements.</li>
          </ul>
        </Section>

        <Section title="4. Data sharing">
          <ul className="ml-5 list-disc space-y-2">
            <li><strong>Partner clinics:</strong> only appointment and health data needed for your consultation.</li>
            <li><strong>Communication providers:</strong> transient processing for approved notifications.</li>
            <li><strong>Legal authorities:</strong> only when required by law.</li>
            <li>Never sold or shared for marketing purposes.</li>
          </ul>
        </Section>

        <Section title="5. Your rights (DPDP Act)">
          <ul className="ml-5 list-disc space-y-2">
            <li>Access, correct, delete or restrict your data anytime.</li>
            <li>Withdraw consent (stops reminders while preserving legal records).</li>
            <li>Contact: <a className="underline" href="mailto:alteredai@alteredai.care">alteredai@alteredai.care</a></li>
          </ul>
        </Section>

        <Section title="6. Data retention">
          <p>We retain personal and health data only for as long as required to deliver the service
          and meet regulatory obligations. You can request deletion at any time and we will erase
          records subject to mandatory legal retention.</p>
        </Section>

        <Section title="7. Children's privacy">
          <p>MediEase is intended for users aged 18 and above or under verified guardian consent.
          We do not knowingly collect data from children outside this scope.</p>
        </Section>

        <Section title="8. Updates to this policy">
          <p>We may update this policy from time to time. Material changes will be communicated
          in-product and via email to clinic administrators.</p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl" style={{ color: PLUM_DEEP }}>{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed" style={{ color: `${PLUM_INK}D9` }}>
        {children}
      </div>
    </section>
  );
}