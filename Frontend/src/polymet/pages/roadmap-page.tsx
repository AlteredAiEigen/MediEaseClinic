import { Link } from "react-router-dom";
import {
  SmartphoneIcon,
  ScanIcon,
  CreditCardIcon,
  GraduationCapIcon,
  BrainCircuitIcon,
  RocketIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  UsersIcon,
  BookOpenIcon,
  AwardIcon,
  ZapIcon,
  HeartPulseIcon,
  ShieldIcon,
  GlobeIcon,
  Building2Icon,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function RoadmapPage() {
  const upcomingFeatures = [
    {
      icon: CreditCardIcon,
      title: "Integration with Ayushman Card",
      quarter: "Q4 2026",
      status: "Planning",
      description:
        "Allow patients to directly check if tests or medicines are covered under the Ayushman card scheme along with coverage limits, improving transparency and cost management.",
      features: [
        "Real-time Ayushman card eligibility verification",
        "Coverage limit checking for tests and medicines",
        "Transparent cost management",
        "Direct claim processing",
        "Coverage details display",
        "Pre-authorization support",
        "Claim status tracking",
        "Seamless integration with Ayushman Bharat scheme",
      ],

      benefits: [
        "Improve transparency for patients",
        "Better cost management",
        "Faster claim processing",
      ],

      gradient: "from-blue-500 to-cyan-500",
      progress: 15,
    },
    {
      icon: CreditCardIcon,
      title: "Linkage to Private Insurance",
      quarter: "Q4 2026",
      status: "Planning",
      description:
        "Enable seamless integration with private insurance providers for better patient benefits and billing processing.",
      features: [
        "Direct integration with major private insurers",
        "Real-time eligibility verification",
        "Automated claim submission",
        "Pre-authorization management",
        "Cashless treatment processing",
        "Claim status tracking",
        "TPA integration (all major TPAs)",
        "Seamless billing processing",
      ],

      benefits: [
        "Better patient benefits",
        "Streamlined billing processing",
        "Faster claim processing",
      ],

      gradient: "from-purple-500 to-pink-500",
      progress: 20,
    },
    {
      icon: Network,
      title: "Cross-Hospital Patient Data Sharing",
      quarter: "Q1 2025",
      status: "Research",
      description:
        "Allow authorized healthcare providers across hospitals to search and view patient details securely, facilitating continuity of care.",
      features: [
        "Secure cross-hospital patient data access",
        "Authorized provider search functionality",
        "Continuity of care facilitation",
        "HIPAA-compliant data sharing",
        "Patient consent management",
        "Audit trail for all access",
        "Encrypted data transmission",
        "Role-based access control",
      ],

      benefits: [
        "Improved continuity of care",
        "Better patient outcomes",
        "Reduced duplicate tests and procedures",
      ],

      gradient: "from-teal-500 to-emerald-500",
      progress: 10,
    },
    {
      icon: GraduationCapIcon,
      title: "Medical Student Training with Simulated Cases",
      quarter: "Q2 2025",
      status: "Research",
      description:
        "Use recorded patient cases to create simulated diagnosis scenarios for medical students, enriching their learning experience with diverse clinical cases.",
      features: [
        "Anonymized patient case simulations",
        "Diverse clinical scenarios",
        "AI-powered diagnosis training",
        "Interactive learning modules",
        "Performance tracking and analytics",
        "Safe learning environment",
        "Real-world case exposure",
        "Medical college partnerships",
      ],

      benefits: [
        "Enrich medical student learning",
        "Exposure to diverse clinical cases",
        "Better prepared healthcare professionals",
      ],

      gradient: "from-orange-500 to-red-500",
      progress: 5,
    },
  ];

  const medicalEducation = {
    icon: GraduationCapIcon,
    title: "AI-Powered Medical Education Platform",
    subtitle: "Transforming MBBS Training in India",
    description:
      "Leveraging anonymized patient case data to create realistic clinical training scenarios for medical students",
    launchQuarter: "Q2 2025",
    features: [
      {
        title: "Case-Based Learning",
        description: "Real patient cases (anonymized) for practical learning",
        icon: BookOpenIcon,
      },
      {
        title: "AI Simulation Modules",
        description: "Interactive patient scenarios with AI-driven responses",
        icon: BrainCircuitIcon,
      },
      {
        title: "Clinical Decision Training",
        description: "Practice diagnosis and treatment planning safely",
        icon: HeartPulseIcon,
      },
      {
        title: "Performance Analytics",
        description: "Track student progress and identify learning gaps",
        icon: TrendingUpIcon,
      },
    ],

    benefits: [
      "Bridge the gap between theory and practice",
      "Expose students to diverse medical cases",
      "Safe environment for learning from mistakes",
      "Prepare students for real-world scenarios",
      "Standardize clinical training quality",
      "Reduce dependency on patient availability",
    ],

    impact: [
      {
        metric: "10,000+",
        label: "Medical Students",
        sublabel: "Expected to benefit annually",
      },
      {
        metric: "50,000+",
        label: "Case Studies",
        sublabel: "Anonymized patient cases",
      },
      {
        metric: "100+",
        label: "Medical Colleges",
        sublabel: "Partnership target",
      },
    ],

    privacy: [
      "Complete patient data anonymization",
      "No personally identifiable information",
      "Ethical review board approval",
      "Consent-based data contribution",
      "HIPAA and Indian privacy law compliant",
      "Secure data handling protocols",
    ],
  };

  const timeline = [
    {
      quarter: "Q4 2026",
      month: "Oct - Dec 2024",
      items: [
        { title: "Integration with Ayushman Card", status: "planned" },
        { title: "Linkage to Private Insurance", status: "planned" },
        { title: "Coverage limit checking", status: "planned" },
      ],
    },
    {
      quarter: "Q1 2025",
      month: "Jan - Mar 2025",
      items: [
        { title: "Cross-Hospital Patient Data Sharing", status: "research" },
        { title: "Secure data access protocols", status: "research" },
        { title: "Continuity of care features", status: "research" },
      ],
    },
    {
      quarter: "Q2 2025",
      month: "Apr - Jun 2025",
      items: [
        { title: "Medical Student Training Platform", status: "research" },
        { title: "Simulated Case Scenarios", status: "research" },
        { title: "Medical College Partnerships", status: "research" },
      ],
    },
  ];

  const statusColors = {
    "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
    planned: "bg-purple-100 text-purple-700 border-purple-200",
    research: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-white to-pink-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <MediEaseLogo size="lg" />
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
                to="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/roadmap"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Roadmap
              </Link>
              <Link
                to="/security"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Security
              </Link>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <RocketIcon className="w-4 h-4" />
              Innovation Roadmap 2024-2025
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              The Future of Healthcare Technology
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover what's coming next in MediEase. From mobile apps to
              AI-powered medical education, we're continuously innovating to
              serve Indian healthcare better.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
              >
                Request Early Access
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                Subscribe to Updates
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Development Timeline</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Track our progress and see what's coming in each quarter
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-purple-200 via-pink-200 to-purple-200" />

            <div className="space-y-12">
              {timeline.map((period, index) => (
                <div key={index} className="relative">
                  {/* Quarter Badge */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg z-10 relative">
                      {period.quarter}
                      <div className="text-xs font-normal opacity-90 mt-1">
                        {period.month}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {period.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-border p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">
                            {item.title}
                          </h4>
                          <div
                            className={`text-xs px-2 py-1 rounded-full border ${statusColors[item.status as keyof typeof statusColors]}`}
                          >
                            {item.status === "in-progress" && "In Progress"}
                            {item.status === "planned" && "Planned"}
                            {item.status === "research" && "Research"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Upcoming Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Major innovations planned for the next 12 months
            </p>
          </div>

          <div className="space-y-8">
            {upcomingFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-border overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                  {/* Left Column */}
                  <div className="lg:col-span-1">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6`}
                    >
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold mb-2">{feature.title}</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {feature.quarter}
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {feature.status}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      {feature.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Development Progress
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {feature.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${feature.gradient} h-full transition-all duration-500`}
                          style={{ width: `${feature.progress}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      className={`w-full bg-gradient-to-r ${feature.gradient} hover:opacity-90`}
                    >
                      Request Early Access
                    </Button>
                  </div>

                  {/* Middle Column - Features */}
                  <div className="lg:col-span-1">
                    <h4 className="font-semibold text-lg mb-4">
                      Planned Features
                    </h4>
                    <ul className="space-y-3">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2Icon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />

                          <span className="text-sm text-muted-foreground">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column - Benefits */}
                  <div className="lg:col-span-1">
                    <h4 className="font-semibold text-lg mb-4">Key Benefits</h4>
                    <div className="space-y-4">
                      {feature.benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100"
                        >
                          <div className="flex items-start gap-3">
                            <ZapIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />

                            <span className="font-medium text-sm">
                              {benefit}
                            </span>
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

      {/* Medical Education Platform */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <GraduationCapIcon className="w-4 h-4" />
              Special Initiative
            </div>
            <h2 className="text-4xl font-bold mb-4">
              {medicalEducation.title}
            </h2>
            <p className="text-xl text-emerald-600 font-semibold mb-4">
              {medicalEducation.subtitle}
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {medicalEducation.description}
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mt-6">
              <CalendarIcon className="w-4 h-4" />
              Expected Launch: {medicalEducation.launchQuarter}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {medicalEducation.features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Impact Metrics */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">
              Expected Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {medicalEducation.impact.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {item.metric}
                  </div>
                  <div className="text-lg font-semibold mb-1">{item.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.sublabel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits and Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefits */}
            <div className="bg-white rounded-2xl border border-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <AwardIcon className="w-8 h-8 text-emerald-600" />

                <h3 className="text-2xl font-bold">Educational Benefits</h3>
              </div>
              <ul className="space-y-3">
                {medicalEducation.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2Icon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />

                    <span className="text-sm text-muted-foreground">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Privacy */}
            <div className="bg-white rounded-2xl border border-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <ShieldIcon className="w-8 h-8 text-blue-600" />

                <h3 className="text-2xl font-bold">Privacy & Ethics</h3>
              </div>
              <ul className="space-y-3">
                {medicalEducation.privacy.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2Icon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />

                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />

            <div className="relative">
              <RocketIcon className="w-16 h-16 mx-auto mb-6 opacity-90" />

              <h2 className="text-4xl font-bold mb-4">
                Be Part of the Innovation
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Get early access to new features and help shape the future of
                healthcare technology in India
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 gap-2"
                >
                  Join Beta Program
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Subscribe to Newsletter
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-6">
                Early access • Exclusive updates • Shape the roadmap
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <MediEaseLogo size="lg" />

          <p className="text-slate-400 mt-4">
            Innovating the future of Indian healthcare
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <a
              href="https://www.linkedin.com/company/medieaseclinic/?lipi=urn%3Ali%3Apage%3Ad_flagship3_company%3Bm0xjg1BkQ9K62D64DBOqfQ%3D%3D"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              LinkedIn
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            © 2025 MediEase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
