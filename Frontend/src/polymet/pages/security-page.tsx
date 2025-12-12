import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  LockIcon,
  KeyIcon,
  EyeOffIcon,
  ServerIcon,
  FileCheckIcon,
  AlertTriangleIcon,
  UserCheckIcon,
  ClockIcon,
  GlobeIcon,
  AwardIcon,
  CheckCircle2Icon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldIcon,
  DatabaseIcon,
  ScanIcon,
  BellIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function SecurityPage() {
  const securityFeatures = [
    {
      icon: LockIcon,
      title: "End-to-End Encryption",
      description:
        "Military-grade AES-256 encryption for all data at rest and in transit",
      details: [
        "AES-256 bit encryption for stored data",
        "TLS 1.3 for data in transit",
        "Encrypted database backups",
        "Secure key management system",
        "Zero-knowledge architecture",
        "Encrypted file storage",
      ],

      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: UserCheckIcon,
      title: "Role-Based Access Control",
      description:
        "Granular permissions ensuring staff only access what they need",
      details: [
        "Multi-level user roles (Admin, Doctor, Receptionist)",
        "Custom permission settings",
        "Department-level access control",
        "Patient data access logging",
        "Temporary access grants",
        "Emergency access protocols",
      ],

      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: ClockIcon,
      title: "Complete Audit Trail",
      description:
        "Comprehensive logging of all system activities and data access",
      details: [
        "Every data access logged with timestamp",
        "User action tracking",
        "Login/logout monitoring",
        "Data modification history",
        "Export and print tracking",
        "Tamper-proof audit logs",
      ],

      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: ServerIcon,
      title: "Secure Cloud Infrastructure",
      description: "Enterprise-grade cloud hosting with 99.9% uptime guarantee",
      details: [
        "AWS/Azure certified data centers",
        "Geographic data redundancy",
        "Automated daily backups",
        "Disaster recovery protocols",
        "DDoS protection",
        "24/7 infrastructure monitoring",
      ],

      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: EyeOffIcon,
      title: "Data Privacy Controls",
      description:
        "Advanced privacy features to protect sensitive patient information",
      details: [
        "Patient consent management",
        "Data anonymization tools",
        "Right to be forgotten compliance",
        "Data portability options",
        "Privacy by design architecture",
        "Minimal data collection principle",
      ],

      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: ScanIcon,
      title: "Regular Security Audits",
      description: "Third-party security assessments and penetration testing",
      details: [
        "Quarterly penetration testing",
        "Annual security audits",
        "Vulnerability scanning",
        "Code security reviews",
        "Compliance assessments",
        "Security patch management",
      ],

      gradient: "from-pink-500 to-rose-500",
    },
  ];

  const compliance = [
    {
      icon: ShieldCheckIcon,
      title: "HIPAA Compliance",
      subtitle: "Health Insurance Portability and Accountability Act",
      description:
        "Full compliance with US healthcare data protection standards",
      requirements: [
        "Administrative safeguards implemented",
        "Physical safeguards for data centers",
        "Technical safeguards for data protection",
        "Business Associate Agreements (BAA) available",
        "Regular risk assessments conducted",
        "Breach notification procedures in place",
      ],

      badge: "Certified",
    },
    {
      icon: GlobeIcon,
      title: "Indian Privacy Laws",
      subtitle: "Digital Personal Data Protection Act 2023",
      description: "Compliant with India's latest data protection regulations",
      requirements: [
        "Data localization for Indian users",
        "Consent management framework",
        "Data fiduciary obligations met",
        "Children's data protection",
        "Cross-border data transfer compliance",
        "Data breach notification within 72 hours",
      ],

      badge: "Compliant",
    },
    {
      icon: AwardIcon,
      title: "ISO 27001 Certified",
      subtitle: "Information Security Management",
      description:
        "International standard for information security management systems",
      requirements: [
        "Risk assessment methodology",
        "Security policy framework",
        "Asset management procedures",
        "Access control measures",
        "Cryptography standards",
        "Incident management protocols",
      ],

      badge: "Certified",
    },
    {
      icon: FileCheckIcon,
      title: "SOC 2 Type II",
      subtitle: "Service Organization Control",
      description:
        "Independent audit of security, availability, and confidentiality",
      requirements: [
        "Security controls verified",
        "Availability monitoring",
        "Processing integrity checks",
        "Confidentiality measures",
        "Privacy protections",
        "Continuous compliance monitoring",
      ],

      badge: "Audited",
    },
  ];

  const securityPractices = [
    {
      icon: KeyIcon,
      title: "Multi-Factor Authentication",
      description:
        "Additional security layer beyond passwords for all user accounts",
    },
    {
      icon: BellIcon,
      title: "Real-Time Threat Detection",
      description:
        "AI-powered monitoring for suspicious activities and potential breaches",
    },
    {
      icon: DatabaseIcon,
      title: "Data Backup & Recovery",
      description:
        "Automated daily backups with point-in-time recovery capabilities",
    },
    {
      icon: AlertTriangleIcon,
      title: "Incident Response Team",
      description:
        "24/7 security team ready to respond to any security incidents",
    },
  ];

  const trustMetrics = [
    { value: "0", label: "Security Breaches", sublabel: "Since inception" },
    { value: "99.9%", label: "Uptime", sublabel: "Last 12 months" },
    { value: "< 72hrs", label: "Breach Notification", sublabel: "Guaranteed" },
    { value: "24/7", label: "Security Monitoring", sublabel: "Always active" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <MediEaseLogo size="md" />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/features"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Features
              </Link>
              <Link
                to="/roadmap"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Roadmap
              </Link>
              <Link
                to="/security"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Security
              </Link>
              <Link
                to="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Pricing
              </Link>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ShieldCheckIcon className="w-4 h-4" />
              Enterprise-Grade Security & Compliance
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Your Data Security is Our Priority
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Bank-level security infrastructure protecting sensitive patient
              data with HIPAA compliance, end-to-end encryption, and continuous
              monitoring.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 gap-2"
              >
                View Security Report
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Contact Security Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Metrics */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {trustMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {metric.value}
                </div>
                <div className="text-lg font-semibold mb-1">{metric.label}</div>
                <div className="text-sm text-muted-foreground">
                  {metric.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Comprehensive Security Measures
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Multiple layers of security protecting your practice and patient
              data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-border p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2Icon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />

                      <span className="text-sm text-muted-foreground">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <AwardIcon className="w-4 h-4" />
              Certified & Compliant
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Industry-Leading Compliance
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Meeting and exceeding international and Indian healthcare data
              protection standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {compliance.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-border p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {item.badge}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-blue-600 font-semibold mb-3">
                  {item.subtitle}
                </p>
                <p className="text-muted-foreground mb-6">{item.description}</p>
                <ul className="space-y-3">
                  {item.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2Icon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />

                      <span className="text-sm text-muted-foreground">
                        {req}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Additional Security Practices
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Going beyond compliance with proactive security measures
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityPractices.map((practice, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white mb-4">
                  <practice.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{practice.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Commitment */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <ShieldIcon className="w-16 h-16 mx-auto mb-6 opacity-90" />

          <h2 className="text-4xl font-bold mb-6">Our Security Commitment</h2>
          <p className="text-xl opacity-90 mb-8 leading-relaxed max-w-3xl mx-auto">
            We understand that healthcare data is among the most sensitive
            information. That's why we've built MediEase with security at its
            core, not as an afterthought. Your trust is our most valuable asset,
            and we protect it with the same care you provide to your patients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-2">Transparent</h3>
              <p className="text-sm opacity-90">
                Regular security updates and clear communication
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-2">Proactive</h3>
              <p className="text-sm opacity-90">
                Continuous monitoring and threat prevention
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-2">Accountable</h3>
              <p className="text-sm opacity-90">
                Taking full responsibility for data protection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />

            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">
                Questions About Security?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Our security team is here to answer any questions and provide
                detailed documentation
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 gap-2"
                >
                  Download Security Whitepaper
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Talk to Security Expert
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-6">
                SOC 2 Type II Report Available • HIPAA BAA Provided
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <MediEaseLogo size="md" />

          <p className="text-slate-400 mt-4">
            Enterprise-grade security for Indian healthcare providers
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <Link
              to="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/features"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              to="/solutions"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Solutions
            </Link>
            <Link
              to="/roadmap"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Roadmap
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            © 2024 MediEase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
