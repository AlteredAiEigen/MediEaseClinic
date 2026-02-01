import { Card } from "@/components/ui/card";
import {
  ShieldCheckIcon,
  LockIcon,
  FileTextIcon,
  ActivityIcon,
  KeyIcon,
  DatabaseIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  EyeIcon,
  ServerIcon,
} from "lucide-react";

export function SecuritySection() {
  const securityFeatures = [
    {
      icon: ShieldCheckIcon,
      title: "HIPAA Compliant",
      description:
        "Full compliance with Health Insurance Portability and Accountability Act standards, adapted for Indian privacy requirements",
      features: [
        "End-to-end encryption",
        "Secure data transmission",
        "Privacy by design",
        "Regular compliance audits",
      ],

      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: LockIcon,
      title: "Encryption at Rest & Transit",
      description:
        "Military-grade AES-256 encryption protects your data both in storage and during transmission",
      features: [
        "256-bit AES encryption",
        "TLS 1.3 for data transit",
        "Encrypted backups",
        "Secure key management",
      ],

      color: "from-emerald-500 to-cyan-500",
    },
    {
      icon: FileTextIcon,
      title: "Complete Audit Trail",
      description:
        "Every action is logged with detailed audit trails for compliance and accountability",
      features: [
        "User activity tracking",
        "Access logs",
        "Change history",
        "Compliance reports",
      ],

      color: "from-cyan-500 to-teal-500",
    },
    {
      icon: KeyIcon,
      title: "Role-Based Access Control",
      description:
        "Granular permissions ensure staff only access data relevant to their role",
      features: [
        "Multi-level permissions",
        "Department-based access",
        "Custom role creation",
        "Access request workflows",
      ],

      color: "from-purple-500 to-teal-500",
    },
    {
      icon: ActivityIcon,
      title: "24/7 Security Monitoring",
      description:
        "Continuous monitoring and threat detection to protect sensitive healthcare data",
      features: [
        "Real-time threat detection",
        "Intrusion prevention",
        "Automated alerts",
        "Security incident response",
      ],

      color: "from-indigo-500 to-teal-500",
    },
    {
      icon: DatabaseIcon,
      title: "Secure Data Storage",
      description:
        "Data stored in ISO 27001 certified data centers with redundant backups",
      features: [
        "Indian data centers",
        "Automated backups",
        "Disaster recovery",
        "99.9% uptime SLA",
      ],

      color: "from-pink-500 to-teal-500",
    },
  ];

  const certifications = [
    {
      name: "HIPAA",
      description: "Health Insurance Portability and Accountability Act",
      icon: ShieldCheckIcon,
    },
    {
      name: "SOC 2 Type II",
      description: "Service Organization Control 2",
      icon: ShieldCheckIcon,
    },
    {
      name: "ISO 27001",
      description: "Information Security Management",
      icon: ShieldCheckIcon,
    },
    {
      name: "GDPR",
      description: "General Data Protection Regulation",
      icon: ShieldCheckIcon,
    },
  ];

  const securityStats = [
    {
      value: "256-bit",
      label: "AES Encryption",
      icon: LockIcon,
    },
    {
      value: "24/7",
      label: "Security Monitoring",
      icon: EyeIcon,
    },
    {
      value: "99.9%",
      label: "Uptime SLA",
      icon: ServerIcon,
    },
    {
      value: "Zero",
      label: "Security Breaches",
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <section
      id="security"
      className="relative bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 py-20"
    >
      {/* Decorative background */}
      <div
        className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.4))]"
        style={{
          backgroundSize: "30px 30px",
          backgroundImage:
            "linear-gradient(to right, rgb(226 232 240 / 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgb(226 232 240 / 0.1) 1px, transparent 1px)",
        }}
      ></div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-6 shadow-lg">
            <ShieldCheckIcon className="w-4 h-4" />
            Enterprise-Grade Security
          </div>
          <h2 className="text-5xl font-bold mb-6">
            Your Data is{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Safe & Compliant
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Built with security at its core. We meet the highest standards for
            healthcare data protection, including HIPAA compliance and Indian
            privacy requirements.
          </p>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {securityStats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-900 dark:to-teal-950/30 rounded-2xl p-8 text-center shadow-lg border border-teal-100 dark:border-teal-900 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-teal-600" />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.features.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />

                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Certifications */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-3xl p-12 mb-16 border border-teal-100 dark:border-teal-900">
          <h3 className="text-3xl font-bold text-center mb-4">
            Certified & Compliant
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Meeting global standards for healthcare data security and privacy
            protection
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {certifications.map((cert, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-10 h-10 text-teal-600" />
                </div>
                <div className="font-bold text-lg mb-1">{cert.name}</div>
                <div className="text-xs text-muted-foreground">
                  {cert.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Audits */}
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-950/30 dark:to-teal-950/30 rounded-3xl p-12 border border-purple-100 dark:border-purple-900">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <FileTextIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Regular Security Audits</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Independent third-party security firms conduct comprehensive
                audits quarterly to ensure we maintain the highest security
                standards and compliance requirements.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-teal-500" />

                  <span className="font-semibold">
                    Quarterly penetration testing
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-teal-500" />

                  <span className="font-semibold">
                    Annual compliance certification
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-teal-500" />

                  <span className="font-semibold">
                    Continuous vulnerability scanning
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="font-bold">Secure Contact</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  All patient communication channels are encrypted and
                  HIPAA-compliant
                </p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <LockIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-bold">Secure Document Upload</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lab reports and medical documents are encrypted during upload
                  and storage
                </p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="font-bold">Compliance Reporting</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automated compliance reports for regulatory requirements and
                  audits
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
