import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BuildingIcon,
  HospitalIcon,
  UserIcon,
  VideoIcon,
  LanguagesIcon,
  BrainIcon,
  TrendingUpIcon,
  BellIcon,
  ScanIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";

export function SolutionsSection() {
  const solutions = [
    {
      icon: BuildingIcon,
      title: "Small & Medium Clinics",
      description:
        "Perfect for independent clinics with 1-5 doctors. Complete practice management in one platform.",
      features: [
        "Patient management & EHR",
        "Appointment scheduling",
        "Digital prescriptions",
        "Billing & invoicing",
        "Queue management",
      ],

      price: "Starting at ₹999/month",
      color: "from-teal-500 to-emerald-500",
      popular: false,
    },
    {
      icon: HospitalIcon,
      title: "Multi-Specialty Hospitals",
      description:
        "Enterprise solution for hospitals with multiple departments and specialties.",
      features: [
        "Multi-department management",
        "Inter-department referrals",
        "Advanced analytics dashboard",
        "Staff & role management",
        "Integrated lab & pharmacy",
      ],

      price: "Starting at ₹8,000/month",
      color: "from-emerald-500 to-cyan-500",
      popular: true,
    },
    {
      icon: UserIcon,
      title: "Solo Practitioners",
      description:
        "Simplified solution for individual doctors starting their practice.",
      features: [
        "Basic EHR & patient records",
        "Appointment booking",
        "E-prescriptions",
        "Patient communication",
        "Mobile app access",
      ],

      price: "Starting at ₹499/month",
      color: "from-cyan-500 to-teal-500",
      popular: false,
    },
    {
      icon: VideoIcon,
      title: "Telemedicine Ready",
      description:
        "Built-in telemedicine capabilities for remote consultations and follow-ups.",
      features: [
        "WhatsApp integration",
        "Video consultations",
        "Remote prescriptions",
        "Digital report sharing",
        "Follow-up management",
      ],

      price: "Add-on: ₹299/month",
      color: "from-purple-500 to-teal-500",
      popular: false,
    },
  ];

  const clinicalFeatures = [
    {
      icon: BrainIcon,
      title: "Clinical Decision Support",
      description:
        "AI-powered recommendations based on patient history, symptoms, and latest medical guidelines",
    },
    {
      icon: TrendingUpIcon,
      title: "Health Trend Analysis",
      description:
        "Track patient health trends over time with visual charts and predictive insights",
    },
    {
      icon: BellIcon,
      title: "Actionable Alerts",
      description:
        "Real-time alerts for critical values, drug interactions, and follow-up reminders",
    },
    {
      icon: ScanIcon,
      title: "Auto Data Extraction",
      description:
        "Extract data from scanned prescriptions, lab reports, and spoken consultations automatically",
    },
  ];

  return (
    <section
      id="solutions"
      className="relative bg-gradient-to-b from-teal-50/30 to-white dark:from-teal-950/20 dark:to-slate-950 py-20"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-6 shadow-lg">
            <HospitalIcon className="w-4 h-4" />
            Tailored for Every Practice
          </div>
          <h2 className="text-5xl font-bold mb-6">
            Solutions for{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Every Healthcare Setup
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Whether you're a solo practitioner or a multi-specialty hospital,
            MediEase adapts to your needs with flexible modules and scalable
            pricing.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {solutions.map((solution, index) => (
            <Card
              key={index}
              className={`relative p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                solution.popular
                  ? "border-2 border-teal-500 dark:border-teal-400"
                  : ""
              }`}
            >
              {solution.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                  Most Popular
                </div>
              )}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${solution.color} flex items-center justify-center mb-6 shadow-lg`}
              >
                <solution.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{solution.title}</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {solution.description}
              </p>
              <ul className="space-y-2 mb-6">
                {solution.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />

                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-6 border-t border-border">
                <div className="text-2xl font-bold text-teal-600 mb-4">
                  {solution.price}
                </div>
                <Button
                  className={`w-full ${
                    solution.popular
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                      : "bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50"
                  }`}
                >
                  Get Started <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Bilingual Support Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-950/30 dark:to-teal-950/30 rounded-3xl p-12 mb-20 border border-purple-100 dark:border-purple-900">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <LanguagesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Bilingual Interface</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Full support for English and Hindi interfaces. Switch languages
                seamlessly to serve diverse patient populations across India.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-border">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />

                  <span className="text-sm font-semibold">English</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-border">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />

                  <span className="text-sm font-semibold">हिंदी</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center border border-border">
                <div className="text-3xl font-bold text-teal-600 mb-2">22+</div>
                <div className="text-sm text-muted-foreground">
                  Languages Supported
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center border border-border">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  100%
                </div>
                <div className="text-sm text-muted-foreground">
                  UI Translation
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center border border-border col-span-2">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  Voice Input
                </div>
                <div className="text-sm text-muted-foreground">
                  In Multiple Languages
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Analysis Features */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Integrated{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Clinical Analysis
              </span>
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Advanced AI-powered clinical features available across all plans
              to enhance decision-making and patient outcomes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clinicalFeatures.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h4 className="font-bold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-8 border border-teal-100 dark:border-teal-900">
            <SparklesIcon className="w-12 h-12 text-teal-600" />

            <h3 className="text-2xl font-bold">
              See Data Extraction in Action
            </h3>
            <p className="text-muted-foreground max-w-xl">
              Watch how MediEase automatically extracts data from scanned
              prescriptions, spoken consultations, and patient-doctor
              interactions—reducing manual entry by 98%
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              Watch Demo Video <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
