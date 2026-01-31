import { Card } from "@/components/ui/card";
import {
  ShieldCheckIcon,
  LockIcon,
  FileTextIcon,
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
      className="relative bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 py-20 lg:py-24"
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
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-6 shadow-lg">
            <ShieldCheckIcon className="w-4 h-4" />
            Enterprise-Grade Security
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Your Data is{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Safe & Compliant
            </span>
          </h2>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            Built with security at its core. We meet the highest standards for
            healthcare data protection, including HIPAA compliance and Indian
            privacy requirements.
          </p>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16 max-w-4xl mx-auto">
          {securityStats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-900 dark:to-teal-950/30 rounded-2xl p-8 lg:p-10 text-center shadow-xl border border-teal-100 dark:border-teal-900 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-5">
                <stat.icon className="w-7 h-7 text-teal-600" />
              </div>
              <div className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card
              key={index}
              className="group p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800"
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.features.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2Icon className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />

                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
