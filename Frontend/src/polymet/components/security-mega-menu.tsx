import {
  ShieldCheckIcon,
  LockIcon,
  FileTextIcon,
  KeyIcon,
  EyeIcon,
  ServerIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  AwardIcon,
  ShieldIcon,
} from "lucide-react";

export function SecurityMegaMenu() {
  const securityFeatures = [
    {
      icon: ShieldCheckIcon,
      title: "HIPAA Compliance",
      description:
        "Full compliance with Health Insurance Portability and Accountability Act, meeting all US healthcare data protection standards.",
      details: [
        "Protected Health Information (PHI) security",
        "Administrative safeguards",
        "Physical safeguards",
      ],

      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: LockIcon,
      title: "Encryption at Rest & Transit",
      description:
        "Military-grade AES-256 encryption for all data storage and TLS 1.3 for data transmission across networks.",
      details: ["AES-256 encryption", "TLS 1.3 protocol", "Encrypted backups"],

      color: "from-emerald-500 to-cyan-500",
    },
    {
      icon: FileTextIcon,
      title: "Comprehensive Audit Trail",
      description:
        "Every action is logged with detailed audit trails for complete accountability and compliance reporting.",
      details: ["User activity logs", "Access history", "Change tracking"],

      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: KeyIcon,
      title: "Role-Based Access Control",
      description:
        "Granular permission system ensuring staff only access information necessary for their role.",
      details: [
        "Custom role definitions",
        "Permission hierarchies",
        "Access restrictions",
      ],

      color: "from-blue-500 to-purple-500",
    },
  ];

  const complianceStandards = [
    {
      icon: ShieldCheckIcon,
      name: "HIPAA",
      description: "Health Insurance Portability and Accountability Act",
      status: "Certified",
    },
    {
      icon: ShieldIcon,
      name: "Indian Privacy",
      description: "Digital Personal Data Protection Act 2023",
      status: "Compliant",
    },
    {
      icon: AwardIcon,
      name: "ISO 27001",
      description: "Information Security Management",
      status: "Certified",
    },
    {
      icon: CheckCircle2Icon,
      name: "SOC 2 Type II",
      description: "Service Organization Control",
      status: "Audited",
    },
  ];

  const additionalSecurity = [
    {
      icon: ServerIcon,
      title: "Secure Infrastructure",
      description:
        "Data centers in India with redundant systems, 99.9% uptime SLA, and disaster recovery protocols.",
    },
    {
      icon: EyeIcon,
      title: "Continuous Monitoring",
      description:
        "24/7 security monitoring with real-time threat detection and automated incident response systems.",
    },
    {
      icon: AlertCircleIcon,
      title: "Third-Party Audits",
      description:
        "Regular security audits by independent firms to ensure compliance and identify vulnerabilities.",
    },
  ];

  return (
    <div className="absolute top-full left-0 w-screen bg-white dark:bg-slate-900 shadow-2xl border-t border-border mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Security Features */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Enterprise-Grade Security
              </h3>
              <p className="text-sm text-muted-foreground">
                Your patient data is protected with the highest security
                standards
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group/item p-5 rounded-xl hover:bg-gradient-to-br hover:from-teal-50/50 hover:to-emerald-50/50 dark:hover:from-teal-950/20 dark:hover:to-emerald-950/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-teal-100 dark:hover:border-teal-900"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base mb-2 group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {feature.description}
                      </p>
                      <ul className="space-y-1">
                        {feature.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <CheckCircle2Icon className="w-3 h-3 text-teal-500 flex-shrink-0" />

                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Security Measures */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900">
              <h3 className="font-bold text-lg mb-4">
                Additional Security Measures
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {additionalSecurity.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-3">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance Standards */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-teal-100 dark:border-teal-900">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <AwardIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Certified & Compliant</h3>
                <p className="text-xs text-muted-foreground">
                  Meeting global standards
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {complianceStandards.map((standard, index) => (
                <div
                  key={index}
                  className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <standard.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">
                          {standard.name}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                          {standard.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {standard.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Security Score</span>
                <span className="text-2xl font-bold">A+</span>
              </div>
              <p className="text-xs opacity-90">
                Independently verified security rating
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheckIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />

                <div>
                  <p className="font-semibold">Zero Security Breaches</p>
                  <p className="text-xs text-muted-foreground">
                    Since inception
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1">
                Your data security is our top priority
              </p>
              <p className="text-xs text-muted-foreground">
                Trusted by healthcare providers across India for secure patient
                data management
              </p>
            </div>
            <a
              href="#security"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Learn More →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
