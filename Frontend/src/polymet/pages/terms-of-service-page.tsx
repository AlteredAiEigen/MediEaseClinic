import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function TermsOfServicePage() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white">
      {/* Navigation */}
      <header className="border-b border-border sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <MediEaseLogo size="lg" />
          </Link>
          <Link to="/role-selection">
            <Button
              variant="ghost"
              size="default"
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 font-medium px-4 py-2"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MediEase Clinic Terms of Use</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 24, 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <p className="text-gray-700 leading-relaxed">
                Welcome to MediEase Clinic (<a href="https://app.clinic.alteredai.care" className="text-teal-600 hover:underline">https://app.clinic.alteredai.care</a>), your trusted platform for booking medical consultations, managing appointments, and receiving healthcare reminders across partner clinics. By accessing or using our Service, you agree to these Terms of Use ("Terms"), our Privacy Policy, and all applicable laws. If you disagree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms form a binding agreement between you ("User," "Patient," or "you") and MediEase Clinic ("we," "us," or "our"). We may update these Terms at any time by posting the revised version on our website. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                MediEase provides:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Patient registration and consultation coordination</li>
                <li>Automated reminders for appointments, follow-ups, and Lab result requests</li>
                <li>Multi-clinic support with secure data management</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We facilitate scheduling and coordination only—no direct medical diagnosis, treatment, or advice is provided through the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Eligibility and Accounts</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You must be 18+ or have legal guardian consent</li>
                <li>Provide accurate personal, health, and contact details during registration</li>
                <li>Maintain account security; notify <a href="mailto:mediease@alteredai.care" className="text-teal-600 hover:underline">mediease@alteredai.care</a> of breaches</li>
                <li>You reserve the right to suspend/terminate accounts for misuse or violations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Communications and Notifications</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Automatic Opt-in for WhatsApp services on patient registration to clinic</li>
                <li>No unsolicited communications; patient-initiated contact opens response window</li>
                <li>Conversations and notifications stored securely for service delivery and compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Patient Data and Conversations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Storage:</strong> Registration data, health notes (symptoms), appointment history, and communication records stored securely
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Your Grant:</strong> Non-exclusive license to store/process your data and conversations for service delivery
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Accuracy:</strong> Ensure data correctness; false information may impact care
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Disclaimers, Limitation of Liability, and Prohibited Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Prohibited Uses:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>No emergency use, diagnosis requests, or non-scheduling inquiries</li>
                <li>No spam, harassment, false data, or commercial use</li>
                <li>Violations result in immediate account termination without refund</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Limitation of Liability:</strong> Not responsible for clinic services, health outcomes, or indirect damages
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                We own all platform content, code, and trademarks. You receive a limited, non-transferable license for personal use. Patient-submitted data used solely for healthcare coordination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed">
                Integrates with partner clinics for consultations and secure communication providers. Not liable for third-party performance, delays, or outcomes. Review their terms separately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Amendments and Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or update these Terms at any time, without prior notice and at our sole discretion. Any such changes will be effective immediately upon being posted on our website. It is your responsibility to periodically review these Terms to stay informed of any updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate access anytime for violations. Upon termination, data retained per legal requirements; request deletion post-retention.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                Unless otherwise required by applicable law, these Terms shall be governed by and construed in accordance with the laws of the jurisdiction where AlteredAI is registered. Any disputes arising from or related to these Terms or the use of the Services shall be resolved according to the dispute resolution procedures detailed in our policies or as mandated by the applicable governing law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions regarding these Terms, the Services, or wish to raise any concerns, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>MediEase Clinic Email:</strong> <a href="mailto:alteredai@alteredai.care" className="text-teal-600 hover:underline">alteredai@alteredai.care</a>
              </p>
            </section>

            <section className="mt-8 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-gray-700 leading-relaxed">
                By using our website and availing the Services, you confirm that you have read, understood, and agreed to these Terms (including our Privacy Policy). If you do not agree with any part of these Terms, please discontinue use of our Services immediately.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link to="/privacy-policy" className="text-teal-600 hover:text-teal-700 hover:underline">
              View Privacy Policy →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <MediEaseLogo size="lg" />
              <p className="text-gray-400 mt-4 text-sm">
                Modern healthcare management platform for clinics and healthcare providers.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/terms-of-service" className="hover:text-teal-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-teal-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/about-us" className="hover:text-teal-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-teal-400 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/features" className="hover:text-teal-400 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="hover:text-teal-400 transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} MediEase Clinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
