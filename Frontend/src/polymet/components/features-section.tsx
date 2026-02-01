import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  DatabaseIcon,
  BotIcon,
  ClipboardListIcon,
  FileTextIcon,
  MicIcon,
  ActivityIcon,
  TrendingUpIcon,
  SparklesIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: CalendarIcon,
      title: "Smart Appointment Management",
      description:
        "Intelligent scheduling with automated reminders, queue management, and real-time availability tracking",
      highlights: [
        "AI-powered slot optimization",
        "Automated SMS/WhatsApp reminders",
        "Walk-in and online booking",
        "Multi-doctor scheduling",
      ],

      color: "from-teal-500 to-emerald-500",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      icon: DatabaseIcon,
      title: "Complete Electronic Health Records",
      description:
        "Comprehensive patient records with full longitudinal history, securely storing all visits, diagnoses, and prescriptions",
      highlights: [
        "Lifetime patient history",
        "Secure cloud storage",
        "Quick search and retrieval",
        "HIPAA-compliant data management",
      ],

      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600",
    },
    {
      icon: BotIcon,
      title: "AI-Powered Check-ins",
      description:
        "Automated patient check-in with intelligent queue control and real-time status updates for seamless patient flow",
      highlights: [
        "Self-service kiosks",
        "Digital queue management",
        "Real-time wait time updates",
        "Priority-based routing",
      ],

      color: "from-cyan-500 to-teal-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
      iconColor: "text-cyan-600",
    },
    {
      icon: MicIcon,
      title: "Automatic Communication Recording",
      description:
        "Every patient-doctor interaction (text/voice/chat) is automatically recorded and accurately transcribed, minimizing manual data entry",
      highlights: [
        "Real-time voice transcription",
        "Medical terminology accuracy",
        "Auto-fill patient details",
        "Zero manual typing",
      ],

      color: "from-purple-500 to-teal-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
    {
      icon: FileTextIcon,
      title: "Digital Prescription Workflow",
      description:
        "Streamlined e-prescription system with medication tracking, drug interaction alerts, and instant pharmacy integration",
      highlights: [
        "Digital prescription generation",
        "Drug interaction warnings",
        "Medication history tracking",
        "Direct pharmacy sharing",
      ],

      color: "from-indigo-500 to-teal-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
      iconColor: "text-indigo-600",
    },
    {
      icon: SparklesIcon,
      title: "AI Clinical Analysis & Guidance",
      description:
        "Leverage stored history, communication, and lab results for AI-powered analysis, personalized recommendations, and clinical tips",
      highlights: [
        "Predictive health insights",
        "Treatment recommendations",
        "Risk factor identification",
        "Clinical decision support",
      ],

      color: "from-pink-500 to-teal-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/30",
      iconColor: "text-pink-600",
    },
  ];

  return (
    <section
      id="features"
      className="relative bg-gradient-to-b from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 py-20"
    >
      {/* Decorative background pattern */}
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
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6 shadow-lg">
            <SparklesIcon className="w-4 h-4" />
            Complete Digital Healthcare Solutions
          </div>
          <h2 className="text-5xl font-bold mb-6">
            Advanced Features for{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Modern Healthcare
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Comprehensive digital solutions designed specifically for Indian
            clinics and healthcare providers. Streamline operations, reduce
            paperwork, and focus on what matters most—patient care.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800"
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.highlights.map((highlight, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2Icon
                      className={`w-4 h-4 ${feature.iconColor} mt-0.5 flex-shrink-0`}
                    />

                    {highlight}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Key Benefits Banner */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-12 text-white">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Transform Your Practice with AI
              </h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Our AI-powered platform automatically records every
                patient-doctor communication, accurately fills patient details,
                and maintains complete longitudinal history—all while minimizing
                manual data entry for your staff.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">
                    98% reduction in manual data entry
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">
                    Complete patient history at your fingertips
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">
                    AI-powered clinical insights and recommendations
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">40%</div>
                <div className="text-sm text-white/80">
                  Faster Consultations
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">30min</div>
                <div className="text-sm text-white/80">Saved Daily</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-sm text-white/80">Digital Records</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">25%</div>
                <div className="text-sm text-white/80">Practice Growth</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
