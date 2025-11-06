import { Link } from "react-router-dom";
import {
  CalendarCheckIcon,
  FileTextIcon,
  BrainCircuitIcon,
  ClockIcon,
  PillIcon,
  VideoIcon,
  MicIcon,
  DatabaseIcon,
  SparklesIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  ZapIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function FeaturesPage() {
  const coreFeatures = [
    {
      icon: CalendarCheckIcon,
      title: "Smart Appointment Management",
      description:
        "Intelligent scheduling system that optimizes doctor availability and patient flow",
      details: [
        "Real-time availability tracking across all doctors",
        "Automated appointment reminders via SMS and WhatsApp",
        "Queue management with estimated wait times",
        "Walk-in patient integration",
        "Recurring appointment scheduling",
        "Multi-location support for hospital chains",
      ],

      gradient: "from-teal-500 to-emerald-500",
    },
    {
      icon: FileTextIcon,
      title: "Comprehensive EHR System",
      description:
        "Complete electronic health records with longitudinal patient history",
      details: [
        "Unified patient records across all visits",
        "Secure document storage and retrieval",
        "Digital prescription management",
        "Lab results integration",
        "Medical imaging storage",
        "Family health history tracking",
      ],

      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: BrainCircuitIcon,
      title: "AI-Powered Patient Insights",
      description:
        "Advanced AI analysis of patient history for personalized care recommendations",
      details: [
        "Predictive health risk assessment",
        "Drug interaction warnings",
        "Treatment effectiveness analysis",
        "Personalized care recommendations",
        "Chronic disease management insights",
        "Clinical decision support",
      ],

      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: ClockIcon,
      title: "Intelligent Queue Control",
      description: "Dynamic queue management system for optimal patient flow",
      details: [
        "Real-time queue status updates",
        "Priority-based patient routing",
        "Estimated consultation time",
        "Mobile queue notifications",
        "Emergency patient fast-tracking",
        "Multi-doctor queue balancing",
      ],

      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: PillIcon,
      title: "E-Prescription System",
      description:
        "Digital prescription generation with drug database integration",
      details: [
        "Pre-filled medication templates",
        "Drug interaction checking",
        "Dosage calculation assistance",
        "Generic medicine suggestions",
        "Prescription history tracking",
        "Direct pharmacy integration",
      ],

      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: VideoIcon,
      title: "Tele-Followup Consultations",
      description: "Secure video consultations for remote patient care",
      details: [
        "HD video consultation platform",
        "Screen sharing for reports review",
        "Digital prescription during calls",
        "Consultation recording (with consent)",
        "Multi-language support",
        "Mobile app integration",
      ],

      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const aiFeatures = [
    {
      icon: MicIcon,
      title: "Voice-to-Text Transcription",
      description:
        "Automatically record and transcribe patient-doctor conversations",
      benefits: [
        "Hands-free documentation during consultations",
        "Accurate medical terminology recognition",
        "Support for Hindi, English, and regional languages",
        "Automatic SOAP note generation",
        "Voice command for common actions",
      ],
    },
    {
      icon: DatabaseIcon,
      title: "Longitudinal Patient Records",
      description: "Complete patient journey tracking across all touchpoints",
      benefits: [
        "Full visit history with timestamps",
        "Diagnosis progression tracking",
        "Medication adherence monitoring",
        "Lab results trend analysis",
        "Treatment outcome measurement",
      ],
    },
    {
      icon: SparklesIcon,
      title: "AI Clinical Guidance",
      description:
        "Intelligent recommendations based on patient history and latest research",
      benefits: [
        "Evidence-based treatment suggestions",
        "Similar case pattern recognition",
        "Preventive care recommendations",
        "Follow-up scheduling optimization",
        "Specialist referral guidance",
      ],
    },
  ];

  const benefits = [
    {
      icon: ZapIcon,
      title: "90% Faster Documentation",
      description: "Reduce manual data entry time with AI-powered automation",
    },
    {
      icon: ShieldCheckIcon,
      title: "100% HIPAA Compliant",
      description: "Enterprise-grade security for all patient data",
    },
    {
      icon: TrendingUpIcon,
      title: "40% More Patients",
      description: "Optimize workflow to see more patients per day",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-emerald-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <MediEaseLogo size="md" />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/solutions"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Solutions
              </Link>
              <Link
                to="/security"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Security
              </Link>
              <Link
                to="/roadmap"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Roadmap
              </Link>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4" />
              Comprehensive Digital Healthcare Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Transform Your Healthcare Practice
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Empower your clinic with AI-driven digital solutions designed
              specifically for Indian healthcare providers. Streamline
              operations, enhance patient care, and grow your practice.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 gap-2"
              >
                Start Free Trial
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white mb-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Digital Solutions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Six powerful modules working together to create a seamless
              healthcare management experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-border p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />

                      <span className="text-sm text-muted-foreground">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Features Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <BrainCircuitIcon className="w-4 h-4" />
              AI-Powered Intelligence
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Smart Automation Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leverage cutting-edge AI to minimize manual work and maximize
              patient care quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-border p-8 hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>
                <div className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />

                      <span className="text-sm text-muted-foreground">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />

            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Transform Your Practice?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of healthcare providers across India who trust
                MediEase for their digital transformation
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-teal-600 hover:bg-gray-100 gap-2"
                >
                  Start Free 30-Day Trial
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Contact Sales
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-6">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <MediEaseLogo size="md" />

          <p className="text-slate-400 mt-4">
            Empowering Indian healthcare providers with seamless digital
            solutions
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <Link
              to="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/solutions"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Solutions
            </Link>
            <Link
              to="/security"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Security
            </Link>
            <Link
              to="/roadmap"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Roadmap
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            © 2024 MediEase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
