import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function PrivacyPolicyPage() {
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
            <MediEaseLogo size="md" />
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MediEase Clinic Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 24, 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <p className="text-gray-700 leading-relaxed">
                At MediEase Clinic, your health data privacy is our top priority. We process personal and sensitive health information with enterprise-grade security, compliant with India's DPDP Act 2023, IT Act 2000, and HIPAA-equivalent standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Patient Personal Data:</strong> Name, phone, email, address during registration</li>
                <li><strong>Health Information:</strong> Symptoms, service preferences, appointment details</li>
                <li><strong>Communication Records:</strong> Message logs, opt-ins, delivery confirmations</li>
                <li><strong>Clinic Technical Data:</strong> IP address, device info, usage patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Data</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Schedule appointments and send WhatsApp notification messages</li>
                <li>Coordinate with partner clinics and patient data access only by doctors during consultation</li>
                <li>Maintain compliance records and audit trails</li>
                <li>No marketing, or data resale without separate consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Data Storage & Security</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>End-to-End Encryption</strong> for all health records and communications</li>
                <li><strong>HIPAA-Equivalent Standards:</strong> Access controls, audit logging, secure deletion</li>
                <li><strong>100% Data Privacy:</strong> No third-party sharing beyond clinics and legal requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Partner Clinics:</strong> Only appointment and health data needed for your consultation</li>
                <li><strong>Communication Providers:</strong> Transient processing for approved notifications</li>
                <li><strong>Legal Authorities:</strong> Only when required by law</li>
                <li>Never sold or shared for marketing purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights (DPDP Act)</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access, correct, delete, or restrict your data anytime</li>
                <li>Withdraw consent (stops reminders while preserving legal records)</li>
                <li><strong>Contact:</strong> <a href="mailto:alteredai@alteredai.care" className="text-teal-600 hover:underline">alteredai@alteredai.care</a></li>
                <li><strong>Complaints:</strong> Digital Personal Data Protection Authority of India</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Data stored in India-compliant servers with Standard Contractual Clauses for any international processors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Communication Preferences and Opt-Out</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We send WhatsApp notification messages for appointment reminders and healthcare-related communications. You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Opt-out of non-essential communications by replying "STOP" to WhatsApp messages</li>
                <li>Contact us at <a href="mailto:alteredai@alteredai.care" className="text-teal-600 hover:underline">alteredai@alteredai.care</a> to manage your communication preferences</li>
                <li>Withdraw consent for automated reminders while preserving legal records</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Important:</strong> Essential healthcare communications required for your medical care may continue even after opting out of non-essential notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Disclaimers and Limitations of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Scope of Liability:</strong> We disclaim liability for unauthorized access to servers or stored data.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Third-Party Services:</strong> We are not responsible for privacy practices of third-party services linked to ours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Policy at any time. Changes take effect upon posting. Continued use of the Services indicates acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email:</strong> <a href="mailto:alteredai@alteredai.care" className="text-teal-600 hover:underline">alteredai@alteredai.care</a>
              </p>
            </section>

            <section className="mt-8 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-gray-700 leading-relaxed">
                By using the Application or our Services, you acknowledge that you have read and understood this Privacy Policy and agree to be bound by its terms.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link to="/terms-of-service" className="text-teal-600 hover:text-teal-700 hover:underline">
              View Terms of Service →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <MediEaseLogo size="md" />
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
