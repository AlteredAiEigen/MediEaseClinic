import {
  CalendarIcon,
  FileTextIcon,
  BrainCircuitIcon,
  UsersIcon,
  PillIcon,
  VideoIcon,
  MicIcon,
  DatabaseIcon,
  SparklesIcon,
  TrendingUpIcon,
  ClipboardListIcon,
  ActivityIcon,
} from "lucide-react";

export function FeaturesMegaMenu() {
  const features = [
    {
      icon: CalendarIcon,
      title: "Smart Appointment Management",
      description:
        "Intelligent scheduling with automated reminders, queue optimization, and real-time availability tracking for seamless patient flow.",
      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: FileTextIcon,
      title: "Comprehensive EHR System",
      description:
        "Complete electronic health records with full longitudinal history, securely storing all visits, diagnoses, prescriptions, and lab results.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: BrainCircuitIcon,
      title: "AI-Powered Patient Insights",
      description:
        "Advanced AI analysis of patient history, communications, and lab results to recommend personalized actions and clinical tips for future visits.",
      color: "from-cyan-500 to-teal-500",
    },
    {
      icon: UsersIcon,
      title: "Intelligent Queue Control",
      description:
        "Dynamic patient queue management with priority-based sorting, wait time predictions, and automated patient notifications.",
      color: "from-purple-500 to-teal-500",
    },
    {
      icon: PillIcon,
      title: "Digital E-Prescription",
      description:
        "Paperless prescription system with medication tracking, drug interaction alerts, and direct pharmacy integration for patient convenience.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: VideoIcon,
      title: "Tele-Followup Care",
      description:
        "WhatsApp-based follow-up consultations for diagnosis feedback and report sharing, reducing unnecessary hospital visits while maintaining care quality.",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const aiFeatures = [
    {
      icon: MicIcon,
      title: "Voice-to-Text Transcription",
      description:
        "Automatically records every patient-doctor communication and accurately fills patient details, minimizing manual data entry for staff.",
    },
    {
      icon: DatabaseIcon,
      title: "Longitudinal Patient Records",
      description:
        "Maintains complete patient history with all visit data, diagnoses, prescriptions, and lab results securely stored and easily accessible.",
    },
    {
      icon: SparklesIcon,
      title: "AI Clinical Guidance",
      description:
        "Uses stored history, communications, and lab results to enable AI analysis, recommending personalized clinical actions and tips.",
    },
  ];

  return (
    <div className="absolute top-full left-0 w-screen bg-white dark:bg-slate-900 shadow-2xl border-t border-border mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Features */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Digital Healthcare Solutions
              </h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive tools designed for modern medical practice
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
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
                      <h4 className="font-bold text-base mb-2 group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI-Powered Features Highlight */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-teal-100 dark:border-teal-900">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI-Powered Features</h3>
                <p className="text-xs text-muted-foreground">
                  Intelligent automation at work
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {aiFeatures.map((feature, index) => (
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

            <div className="mt-6 pt-6 border-t border-teal-200 dark:border-teal-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Save up to 30 minutes daily
                </span>
                <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                  <TrendingUpIcon className="w-4 h-4" />
                  85% efficiency
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
                Experience the complete digital healthcare platform
              </p>
              <p className="text-xs text-muted-foreground">
                Trusted by healthcare providers across India
              </p>
            </div>
            <a
              href="#features"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Explore All Features →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
