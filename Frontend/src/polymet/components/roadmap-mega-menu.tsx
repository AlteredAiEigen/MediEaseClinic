import {
  SmartphoneIcon,
  FileSearchIcon,
  CreditCardIcon,
  GraduationCapIcon,
  BrainCircuitIcon,
  RocketIcon,
  SparklesIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";

export function RoadmapMegaMenu() {
  const upcomingFeatures = [
    {
      icon: SmartphoneIcon,
      title: "Native Mobile App",
      description:
        "iOS and Android apps for doctors and patients with offline capabilities, push notifications, and seamless sync.",
      timeline: "Q2 2024",
      status: "In Development",
      color: "from-teal-500 to-emerald-500",
      features: [
        "Offline access",
        "Push notifications",
        "Biometric authentication",
      ],
    },
    {
      icon: FileSearchIcon,
      title: "Advanced Prescription Analysis",
      description:
        "AI-powered prescription review with drug interaction detection, dosage optimization, and alternative medication suggestions.",
      timeline: "Q3 2024",
      status: "Planning",
      color: "from-emerald-500 to-cyan-500",
      features: [
        "Drug interactions",
        "Dosage optimization",
        "Generic alternatives",
      ],
    },
    {
      icon: CreditCardIcon,
      title: "Insurance Integrations",
      description:
        "Direct integration with major Indian insurance providers for real-time eligibility checks and automated claim processing.",
      timeline: "Q4 2026",
      status: "Planning",
      color: "from-cyan-500 to-blue-500",
      features: [
        "Eligibility verification",
        "Automated claims",
        "Pre-authorization",
      ],
    },
  ];

  const medicalEducation = {
    icon: GraduationCapIcon,
    title: "AI-Powered Medical Education Platform",
    description:
      "Securely stored patient case data will be anonymized and leveraged for clinical training of MBBS students, contributing to modern medical education in India through AI-powered simulation modules.",
    timeline: "2025",
    highlights: [
      {
        title: "Anonymized Case Studies",
        description:
          "Real patient cases transformed into educational content while maintaining complete privacy and HIPAA compliance.",
      },
      {
        title: "AI Simulation Modules",
        description:
          "Interactive clinical scenarios powered by AI to train medical students in diagnosis and treatment planning.",
      },
      {
        title: "Clinical Decision Training",
        description:
          "Practice-based learning with feedback from AI analyzing student decisions against best practices.",
      },
      {
        title: "Medical College Partnerships",
        description:
          "Collaborating with leading Indian medical institutions to integrate into MBBS curriculum.",
      },
    ],
  };

  const roadmapTimeline = [
    {
      quarter: "Q2 2024",
      items: [
        "Native mobile apps launch",
        "Enhanced telemedicine features",
        "Multi-language voice support",
      ],
    },
    {
      quarter: "Q3 2024",
      items: [
        "Advanced prescription analysis",
        "Patient portal enhancements",
        "Pharmacy integrations",
      ],
    },
    {
      quarter: "Q4 2024",
      items: [
        "Insurance integrations",
        "Advanced analytics dashboard",
        "API for third-party integrations",
      ],
    },
    {
      quarter: "2025",
      items: [
        "Medical education platform",
        "AI clinical assistant",
        "Research data platform",
      ],
    },
  ];

  return (
    <div className="absolute top-full left-0 w-screen bg-white dark:bg-slate-900 shadow-2xl border-t border-border mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Features */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Upcoming Features
              </h3>
              <p className="text-sm text-muted-foreground">
                Innovation roadmap for the future of healthcare
              </p>
            </div>
            <div className="space-y-4 mb-8">
              {upcomingFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group/item p-5 rounded-xl hover:bg-gradient-to-br hover:from-teal-50/50 hover:to-emerald-50/50 dark:hover:from-teal-950/20 dark:hover:to-emerald-950/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-teal-100 dark:hover:border-teal-900"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-base group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400 transition-colors">
                          {feature.title}
                        </h4>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
                            {feature.timeline}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                            {feature.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {feature.features.map((item, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-border rounded-full"
                          >
                            <CheckCircle2Icon className="w-3 h-3 text-teal-500" />

                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Medical Education Highlight */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-900">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <medicalEducation.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">
                      {medicalEducation.title}
                    </h3>
                    <span className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-semibold">
                      {medicalEducation.timeline}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {medicalEducation.description}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {medicalEducation.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4"
                  >
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />

                      {highlight.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-teal-100 dark:border-teal-900">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Release Timeline</h3>
                <p className="text-xs text-muted-foreground">
                  Planned rollout schedule
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {roadmapTimeline.map((period, index) => (
                <div key={index} className="relative">
                  {index < roadmapTimeline.length - 1 && (
                    <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-teal-200 dark:bg-teal-800"></div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg relative z-10">
                      <ClockIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-white/80 dark:bg-slate-900/80 rounded-xl p-4">
                      <h4 className="font-bold text-sm mb-3">
                        {period.quarter}
                      </h4>
                      <ul className="space-y-2">
                        {period.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-muted-foreground"
                          >
                            <CheckCircle2Icon className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />

                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 text-sm">
                <RocketIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />

                <div>
                  <p className="font-semibold">Continuous Innovation</p>
                  <p className="text-xs text-muted-foreground">
                    Regular updates every quarter
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
                Stay ahead with cutting-edge healthcare technology
              </p>
              <p className="text-xs text-muted-foreground">
                Be the first to access new features as they launch
              </p>
            </div>
            <a
              href="#roadmap"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              View Full Roadmap →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
