import {
  BuildingIcon,
  HospitalIcon,
  UserIcon,
  VideoIcon,
  LanguagesIcon,
  BrainCircuitIcon,
  TrendingUpIcon,
  BellIcon,
  FileSearchIcon,
  ScanIcon,
  MicIcon,
  SparklesIcon,
} from "lucide-react";

export function SolutionsMegaMenu() {
  const solutions = [
    {
      icon: BuildingIcon,
      title: "Small & Medium Clinics",
      description:
        "Complete digital solution for clinics with 1-5 doctors. Streamlined workflows, patient management, and AI-powered documentation.",
      features: ["Queue Management", "E-Prescriptions", "Basic Analytics"],
      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: HospitalIcon,
      title: "Multi-Specialty Hospitals",
      description:
        "Enterprise-grade platform for large hospitals with multiple departments, advanced analytics, and integrated clinical decision support.",
      features: [
        "Department Management",
        "Advanced Analytics",
        "Multi-location Support",
      ],

      color: "from-emerald-500 to-cyan-500",
    },
    {
      icon: UserIcon,
      title: "Solo Practitioners",
      description:
        "Simplified interface for individual doctors. Focus on patient care with automated documentation and smart scheduling.",
      features: ["Personal Dashboard", "Patient Portal", "Mobile Access"],
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: VideoIcon,
      title: "Telemedicine Practices",
      description:
        "WhatsApp-based consultations with secure video calls, digital prescriptions, and remote patient monitoring capabilities.",
      features: [
        "WhatsApp Integration",
        "Video Consultations",
        "Remote Monitoring",
      ],

      color: "from-blue-500 to-purple-500",
    },
    {
      icon: LanguagesIcon,
      title: "Bilingual Support",
      description:
        "Full support for English and Hindi with regional language options. Voice commands and transcription in multiple Indian languages.",
      features: ["Hindi & English", "Voice Commands", "Regional Languages"],
      color: "from-purple-500 to-pink-500",
    },
  ];



  const demoFeatures = [
    {
      icon: ScanIcon,
      title: "Scanned Prescription Extraction",
      description:
        "Upload prescription images and automatically extract medication details, dosages, and instructions.",
    },
    {
      icon: MicIcon,
      title: "Voice-to-Data Recording",
      description:
        "Record patient-doctor conversations and automatically populate patient records with structured data.",
    },
  ];

  return (
    <div className="absolute top-full left-0 w-screen bg-white dark:bg-slate-900 shadow-2xl border-t border-border mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tailored Solutions */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Tailored for Every Practice
              </h3>
              <p className="text-sm text-muted-foreground">
                Solutions designed for your specific healthcare setup
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="group/item p-5 rounded-xl hover:bg-gradient-to-br hover:from-teal-50/50 hover:to-emerald-50/50 dark:hover:from-teal-950/20 dark:hover:to-emerald-950/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-teal-100 dark:hover:border-teal-900"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${solution.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform duration-300`}
                    >
                      <solution.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base mb-2 group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400 transition-colors">
                        {solution.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {solution.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {solution.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Features */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-900">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                <h3 className="font-bold text-lg">
                  Auto-Extraction Technology
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {demoFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Analysis Features */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-teal-100 dark:border-teal-900">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <BrainCircuitIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {clinicalFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Clinical Accuracy</span>
                <span className="text-2xl font-bold">98%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2"
                  style={{ width: "98%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1">
                Find the perfect solution for your practice
              </p>
              <p className="text-xs text-muted-foreground">
                Customizable modules for every healthcare setup
              </p>
            </div>
            <a
              href="#solutions"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Explore Solutions →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
