import { } from "react-router-dom";
import { SiteHeader } from "@/landing/components/SiteHeader";

const CREAM = "#faf7f2";
const PLUM_DEEP = "#2a0a18";
const PLUM_INK = "#3a0a1f";

export function TermsPage() {
  return (
    <div style={{ background: CREAM, color: PLUM_INK }} className="min-h-screen">
      <div style={{ background: "#ffffff" }}>
        <SiteHeader variant="light" />
      </div>
      <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <p className="text-xs uppercase tracking-wider" style={{ color: `${PLUM_INK}80` }}>Legal</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight" style={{ color: PLUM_DEEP }}>
          Terms of service
        </h1>
        <p className="mt-3 text-sm" style={{ color: `${PLUM_INK}99` }}>Last updated: December 24, 2025</p>

        <p className="mt-8 text-base leading-relaxed">
          Welcome to MediEase — a platform for ambient AI consultations, smart prescriptions and
          patient intelligence across partner clinics. By accessing or using our service, you agree
          to these Terms of Use, our Privacy Policy and all applicable laws.
        </p>

        <Section title="1. Acceptance of terms">
          <p>These Terms form a binding agreement between you ("User", "Patient", "Clinic") and
          MediEase. We may update these Terms by posting the revised version on our website.
          Continued use after changes constitutes acceptance.</p>
        </Section>

        <Section title="2. Description of service">
          <ul className="ml-5 list-disc space-y-2">
            <li>Ambient AI consultation capture, summaries and prescriptions.</li>
            <li>Patient registration, appointment scheduling and reminders.</li>
            <li>Multi-clinic and multi-doctor support with role-based access.</li>
          </ul>
          <p>We facilitate clinical workflows — no direct medical diagnosis, treatment or advice
          is provided through the platform itself.</p>
        </Section>

        <Section title="3. Eligibility & accounts">
          <ul className="ml-5 list-disc space-y-2">
            <li>You must be 18+ or have legal guardian consent.</li>
            <li>Provide accurate personal, professional and contact details during registration.</li>
            <li>Maintain account security; notify <a className="underline" href="mailto:alteredai@alteredai.care">alteredai@alteredai.care</a> of any breach.</li>
            <li>We reserve the right to suspend or terminate accounts for misuse or violations.</li>
          </ul>
        </Section>

        <Section title="4. Communications & notifications">
          <ul className="ml-5 list-disc space-y-2">
            <li>Patients automatically opt in to clinic notifications on registration.</li>
            <li>No unsolicited communications; patient-initiated contact opens response windows.</li>
            <li>Conversations and notifications are stored securely for service delivery and compliance.</li>
          </ul>
        </Section>

        <Section title="5. Payments & billing">
          <ul className="ml-5 list-disc space-y-2">
            <li>Pay-as-you-go usage is billed monthly against completed consultations.</li>
            <li>Clinic licenses and Enterprise agreements are billed per the signed order form.</li>
            <li>All charges are exclusive of taxes; GST is added where applicable.</li>
          </ul>
        </Section>

        <Section title="6. Acceptable use">
          <ul className="ml-5 list-disc space-y-2">
            <li>Do not upload content that violates law, infringes rights, or harms patients.</li>
            <li>Do not attempt to reverse-engineer, disrupt or overload the service.</li>
            <li>Do not use MediEase to provide unlicensed medical advice.</li>
          </ul>
        </Section>

        <Section title="7. Data & privacy">
          <p>Our handling of personal and health information is governed by our{" "}
            <a className="underline" href="/privacy-policy">Privacy Policy</a>. Clinics are
            responsible for obtaining patient consent for clinical capture where required by local law.</p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>MediEase is provided on an "as is" basis. To the maximum extent permitted by law,
          MediEase shall not be liable for indirect, incidental or consequential damages arising
          from use of the service.</p>
        </Section>

        <Section title="9. Governing law">
          <p>These Terms are governed by the laws of India. Disputes are subject to the exclusive
          jurisdiction of courts in Jammu, India.</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions about these Terms? Reach us at{" "}
            <a className="underline" href="mailto:alteredai@alteredai.care">alteredai@alteredai.care</a>.</p>
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