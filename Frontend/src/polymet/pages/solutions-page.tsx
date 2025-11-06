import { Link } from "react-router-dom";
import {
  BuildingIcon,
  HospitalIcon,
  StethoscopeIcon,
  VideoIcon,
  LanguagesIcon,
  TrendingUpIcon,
  BellRingIcon,
  ClipboardCheckIcon,
  ScanIcon,
  MicIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  UsersIcon,
  CalendarIcon,
  ActivityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function SolutionsPage() {
  const solutions = [
    {
      icon: BuildingIcon,
      title: "Small & Medium Clinics",
      subtitle: "Perfect for 1-5 doctor practices",
      description:
        "Streamlined solution for independent clinics and small group practices",
      features: [
        "Single-location appointment management",
        "Basic EHR with patient records",
        "E-prescription generation",
        "Queue management system",
        "WhatsApp appointment reminders",
        "Basic reporting and analytics",
        "Patient billing integration",
        "Inventory management for medicines",
      ],

      idealFor: [
        "General Practitioners",
        "Dental Clinics",
        "Pediatric Clinics",
        "Dermatology Centers",
      ],

      gradient: "from-teal-500 to-emerald-500",
      stats: [
        { label: "Setup Time", value: "< 1 Day" },
        { label: "Training Required", value: "2 Hours" },
        { label: "Avg. ROI", value: "3 Months" },
      ],
    },
    {
      icon: HospitalIcon,
      title: "Multi-Specialty Hospitals",
      subtitle: "Enterprise solution for 10+ doctors",
      description:
        "Comprehensive platform for large hospitals with multiple departments",
      features: [
        "Multi-department management",
        "Advanced EHR with imaging integration",
        "OPD and IPD management",
        "Lab and radiology integration",
        "Pharmacy management system",
        "Bed management and allocation",
        "Insurance claim processing",
        "Advanced analytics and reporting",
        "Multi-location support",
        "Role-based access control",
      ],

      idealFor: [
        "Multi-Specialty Hospitals",
        "Diagnostic Centers",
        "Surgical Centers",
        "Maternity Hospitals",
      ],

      gradient: "from-blue-500 to-cyan-500",
      stats: [
        { label: "Setup Time", value: "1-2 Weeks" },
        { label: "Training Required", value: "1 Week" },
        { label: "Avg. ROI", value: "6 Months" },
      ],
    },
    {
      icon: StethoscopeIcon,
      title: "Solo Practitioners",
      subtitle: "Simplified for individual doctors",
      description:
        "Lightweight solution designed for independent medical professionals",
      features: [
        "Personal appointment calendar",
        "Digital patient records",
        "Quick prescription templates",
        "Voice-to-text consultation notes",
        "Mobile app for on-the-go access",
        "Patient communication via SMS/WhatsApp",
        "Simple billing and invoicing",
        "Cloud backup and sync",
      ],

      idealFor: [
        "Consultants",
        "Home Visit Doctors",
        "Specialist Doctors",
        "Part-time Practitioners",
      ],

      gradient: "from-purple-500 to-pink-500",
      stats: [
        { label: "Setup Time", value: "< 2 Hours" },
        { label: "Training Required", value: "30 Mins" },
        { label: "Avg. ROI", value: "1 Month" },
      ],
    },
    {
      icon: VideoIcon,
      title: "Telemedicine Practices",
      subtitle: "Built for remote consultations",
      description:
        "Complete telemedicine platform with video consultation capabilities",
      features: [
        "HD video consultation platform",
        "Screen sharing for report review",
        "Digital prescription during calls",
        "Online payment integration",
        "Automated follow-up scheduling",
        "Patient portal for document upload",
        "Consultation recording (with consent)",
        "Multi-device support (web, mobile, tablet)",
      ],

      idealFor: [
        "Online Consultants",
        "Mental Health Professionals",
        "Nutritionists",
        "Follow-up Specialists",
      ],

      gradient: "from-orange-500 to-red-500",
      stats: [
        { label: "Setup Time", value: "< 4 Hours" },
        { label: "Training Required", value: "1 Hour" },
        { label: "Avg. ROI", value: "2 Months" },
      ],
    },
    {
      icon: LanguagesIcon,
      title: "Bilingual Support",
      subtitle: "Hindi & English interface",
      description:
        "Seamless language switching for staff and patients across India",
      features: [
        "Full Hindi and English interface",
        "Regional language support (coming soon)",
        "Bilingual prescription generation",
        "Voice recognition in multiple languages",
        "Patient communication in preferred language",
        "Multilingual reports and documents",
        "Language-specific templates",
        "Cultural context awareness",
      ],

      idealFor: [
        "Tier 2/3 City Clinics",
        "Rural Healthcare Centers",
        "Government Hospitals",
        "Community Health Centers",
      ],

      gradient: "from-emerald-500 to-teal-500",
      stats: [
        { label: "Languages", value: "2+ Active" },
        { label: "Coming Soon", value: "10+ Regional" },
        { label: "Accuracy", value: "98%" },
      ],
    },
  ];

  const clinicalAnalysis = [
    {
      icon: TrendingUpIcon,
      title: "Decision Support System",
      description:
        "AI-powered clinical decision support with evidence-based recommendations",
      capabilities: [
        "Drug interaction warnings",
        "Dosage calculation assistance",
        "Differential diagnosis suggestions",
        "Treatment protocol recommendations",
        "Lab test interpretation guidance",
      ],
    },
    {
      icon: ActivityIcon,
      title: "Trend Analysis",
      description:
        "Comprehensive health trend tracking and predictive analytics",
      capabilities: [
        "Patient vitals trending over time",
        "Chronic disease progression monitoring",
        "Treatment effectiveness analysis",
        "Population health insights",
        "Seasonal disease pattern recognition",
      ],
    },
    {
      icon: BellRingIcon,
      title: "Actionable Alerts",
      description:
        "Smart notifications for critical patient events and follow-ups",
      capabilities: [
        "Critical lab result alerts",
        "Medication refill reminders",
        "Overdue follow-up notifications",
        "Preventive care reminders",
        "Emergency patient flagging",
      ],
    },
  ];

  const autoExtraction = [
    {
      icon: ScanIcon,
      title: "Scanned Prescription Analysis",
      description:
        "Extract medication details from scanned or photographed prescriptions",
      accuracy: "95%+",
    },
    {
      icon: MicIcon,
      title: "Voice-to-Data Recording",
      description:
        "Convert doctor-patient conversations into structured medical records",
      accuracy: "92%+",
    },
    {
      icon: ClipboardCheckIcon,
      title: "Automatic SOAP Notes",
      description:
        "Generate clinical notes automatically from consultation recordings",
      accuracy: "90%+",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-cyan-50/30">
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
                to="/features"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Features
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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4" />
              Tailored for Every Healthcare Setup
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Solutions Built for Your Practice
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              From solo practitioners to multi-specialty hospitals, we have the
              perfect solution tailored to your specific needs and scale of
              operations.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 gap-2"
              >
                Find Your Solution
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                Compare Plans
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Perfect Fit</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each solution is carefully designed with specific practice types
              in mind
            </p>
          </div>

          <div className="space-y-12">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-border overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                  {/* Left Column - Header */}
                  <div className="lg:col-span-1">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.gradient} text-white mb-6`}
                    >
                      <solution.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold mb-2">
                      {solution.title}
                    </h3>
                    <p className="text-teal-600 font-semibold mb-4">
                      {solution.subtitle}
                    </p>
                    <p className="text-muted-foreground mb-6">
                      {solution.description}
                    </p>

                    {/* Stats */}
                    <div className="space-y-3 mb-6">
                      {solution.stats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 border-b border-border"
                        >
                          <span className="text-sm text-muted-foreground">
                            {stat.label}
                          </span>
                          <span className="font-semibold">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full bg-gradient-to-r ${solution.gradient} hover:opacity-90`}
                    >
                      Learn More
                    </Button>
                  </div>

                  {/* Middle Column - Features */}
                  <div className="lg:col-span-1">
                    <h4 className="font-semibold text-lg mb-4">Key Features</h4>
                    <ul className="space-y-3">
                      {solution.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />

                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column - Ideal For */}
                  <div className="lg:col-span-1">
                    <h4 className="font-semibold text-lg mb-4">Ideal For</h4>
                    <div className="space-y-3">
                      {solution.idealFor.map((type, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-4 border border-teal-100"
                        >
                          <div className="flex items-center gap-3">
                            <UsersIcon className="w-5 h-5 text-teal-600" />

                            <span className="font-medium text-sm">{type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Analysis Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ActivityIcon className="w-4 h-4" />
              Integrated Clinical Intelligence
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Advanced Clinical Analysis Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built-in decision support, trend analysis, and actionable alerts
              available across all solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clinicalAnalysis.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-border p-8 hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.capabilities.map((capability, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />

                      <span className="text-sm text-muted-foreground">
                        {capability}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auto-Extraction Demo Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <SparklesIcon className="w-4 h-4" />
              AI-Powered Automation
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Intelligent Data Extraction
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Automatically extract and structure medical data from multiple
              sources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {autoExtraction.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-8 hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                      style={{ width: feature.accuracy }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-purple-600">
                    {feature.accuracy}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Accuracy Rate
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />

            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">
                Find Your Perfect Solution Today
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Not sure which solution fits your practice? Our team will help
                you choose the right one.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-gray-100 gap-2"
                >
                  Schedule Consultation
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Compare All Solutions
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-6">
                Free consultation • No commitment • Expert guidance
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
            Tailored solutions for every healthcare practice in India
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <Link
              to="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/features"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Features
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
