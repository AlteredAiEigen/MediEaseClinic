import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SmartphoneIcon,
  BarChart3Icon,
  PillIcon,
  CreditCardIcon,
  GraduationCapIcon,
  BrainIcon,
  RocketIcon,
  CheckCircle2Icon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "lucide-react";

export function RoadmapSection() {
  const upcomingFeatures = [
    {
      icon: SmartphoneIcon,
      title: "Native Mobile App",
      description:
        "iOS and Android apps for doctors and patients with offline capabilities",
      timeline: "Q2 2024",
      status: "In Development",
      features: [
        "Offline patient records access",
        "Mobile prescription writing",
        "Push notifications",
        "Biometric authentication",
      ],

      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: BarChart3Icon,
      title: "Advanced Queue Analytics",
      description:
        "AI-powered queue optimization with predictive wait times and patient flow analysis",
      timeline: "Q3 2024",
      status: "Planned",
      features: [
        "Predictive wait time calculation",
        "Patient flow optimization",
        "Peak hour analysis",
        "Staff allocation recommendations",
      ],

      color: "from-emerald-500 to-cyan-500",
    },
    {
      icon: PillIcon,
      title: "Enhanced Prescription Analysis",
      description:
        "Advanced drug interaction detection and personalized medication recommendations",
      timeline: "Q3 2024",
      status: "Planned",
      features: [
        "AI-powered drug interactions",
        "Allergy cross-checking",
        "Generic alternatives suggestion",
        "Dosage optimization",
      ],

      color: "from-cyan-500 to-teal-500",
    },
    {
      icon: CreditCardIcon,
      title: "Insurance Integrations",
      description:
        "Direct integration with major Indian insurance providers for seamless claims",
      timeline: "Q4 2024",
      status: "Planned",
      features: [
        "Real-time eligibility verification",
        "Automated claim submission",
        "Pre-authorization management",
        "Cashless treatment processing",
      ],

      color: "from-purple-500 to-teal-500",
    },
  ];

  const educationInitiative = {
    title: "Medical Education Initiative",
    description:
      "Securely stored patient case data will be anonymized and leveraged for clinical training of MBBS students, contributing to modern medical education in India through AI-powered simulation modules.",
    features: [
      {
        title: "Anonymized Case Studies",
        description:
          "Real patient cases transformed into learning materials while maintaining complete privacy",
        icon: BrainIcon,
      },
      {
        title: "AI-Powered Simulations",
        description:
          "Interactive clinical scenarios based on actual patient data for hands-on learning",
        icon: SparklesIcon,
      },
      {
        title: "Clinical Decision Training",
        description:
          "Practice diagnosis and treatment planning with AI feedback and guidance",
        icon: GraduationCapIcon,
      },
    ],

    benefits: [
      "Bridge theory-practice gap for medical students",
      "Access to diverse clinical scenarios",
      "Safe learning environment without patient risk",
      "Contribution to India's medical education advancement",
    ],
  };

  return (
    <section
      id="roadmap"
      className="relative bg-gradient-to-b from-teal-50/30 to-white dark:from-teal-950/20 dark:to-slate-950 py-20"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6 shadow-lg">
            <RocketIcon className="w-4 h-4" />
            What's Coming Next
          </div>
          <h2 className="text-5xl font-bold mb-6">
            Product{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            We're constantly innovating to bring you the most advanced
            healthcare management features. Here's what's in development and
            coming soon.
          </p>
        </div>

        {/* Upcoming Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {upcomingFeatures.map((feature, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    feature.status === "In Development"
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {feature.status}
                </div>
              </div>

              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold">{feature.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <ClockIcon className="w-4 h-4" />

                <span>Expected: {feature.timeline}</span>
              </div>

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

        {/* Medical Education Initiative - Highlighted Section */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl overflow-hidden mb-16">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Content */}
            <div className="p-12 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCapIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Coming 2025
                  </div>
                  <h3 className="text-2xl font-bold">
                    {educationInitiative.title}
                  </h3>
                </div>
              </div>

              <p className="text-white/90 mb-8 leading-relaxed text-lg">
                {educationInitiative.description}
              </p>

              <div className="space-y-4 mb-8">
                {educationInitiative.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2Icon className="w-4 h-4" />
                    </div>
                    <span className="text-white/90">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-teal-600 hover:bg-gray-100"
              >
                Learn More About This Initiative{" "}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Right Side - Features */}
            <div className="bg-white/10 backdrop-blur-sm p-12 flex flex-col justify-center">
              <div className="space-y-6">
                {educationInitiative.features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-white/80">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stay Updated CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto p-12">
            <SparklesIcon className="w-12 h-12 text-teal-600 mx-auto mb-6" />

            <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Be the first to know when new features launch. Subscribe to our
              product updates and get early access to beta features.
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-background"
              />

              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Join 5,000+ healthcare providers already subscribed
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
