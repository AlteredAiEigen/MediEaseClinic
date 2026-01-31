import { Card } from "@/components/ui/card";
import {
  CalendarIcon,
  DatabaseIcon,
  MicIcon,
  SparklesIcon,
  CheckCircle2Icon,
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
  
 
  ];

  return (
    <section
      id="features"
      className="relative bg-gradient-to-b from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 py-20 lg:py-24"
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
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6 shadow-lg">
            <SparklesIcon className="w-4 h-4" />
            Complete Digital Healthcare Solutions
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Advanced Features for{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Modern Healthcare
            </span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Streamline operations. Reduce paperwork. Focus on patient care.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800 rounded-2xl"
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
                {feature.highlights.map((highlight, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2Icon
                      className={`w-5 h-5 ${feature.iconColor} mt-0.5 flex-shrink-0`}
                    />

                    {highlight}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Key Benefits Banner */}
       
      </div>
    </section>
  );
}
