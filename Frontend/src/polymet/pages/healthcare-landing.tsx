import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  RocketIcon,
  ArrowRightIcon,
  PlayIcon,
  SparklesIcon,
  ClockIcon,
  ZapIcon,
  CheckCircle2Icon,
  UsersIcon,
  CalendarIcon,
  MicIcon,
  FileTextIcon,
  TrendingUpIcon,
  SettingsIcon,
  ActivityIcon,
  UserIcon,
  ShieldCheckIcon,
  ClipboardListIcon,
  BarChart3Icon,
} from "lucide-react";
import { FeaturesSection } from "@/polymet/components/features-section";
import { SolutionsSection } from "@/polymet/components/solutions-section";
import { SecuritySection } from "@/polymet/components/security-section";
import { RoadmapSection } from "@/polymet/components/roadmap-section";
import { PricingSection } from "@/polymet/components/pricing-section";

export function HealthcareLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <div className="font-bold text-lg text-foreground">MediEase</div>
              <div className="text-xs text-teal-600">
                Your Health, Our Mission
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features">
              <span className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
                Features
              </span>
            </Link>
            <Link to="/solutions">
              <span className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
                Solutions
              </span>
            </Link>
            <Link to="/security">
              <span className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
                Security
              </span>
            </Link>
            <Link to="/roadmap">
              <span className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
                Roadmap
              </span>
            </Link>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
            >
              Pricing
            </a>
            <Link to="/role-selection">
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 font-medium"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/role-selection">
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                Start Free Trial
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-600 text-sm">
              <RocketIcon className="w-4 h-4" />✨ Launching Soon - Transform
              Your Healthcare Practice
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Connecting Clinics
              </span>
              <br />

              <span className="text-foreground">& Hospitals Digitally</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Empowering Indian healthcare providers with seamless digital
              solutions for appointments, EHR, e-prescriptions, and AI-powered
              consultations
            </p>
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-teal-100 dark:border-teal-900">
              <p className="text-base text-foreground">
                Streamline your clinic operations with{" "}
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  faster consults, fewer clicks,
                </span>{" "}
                and{" "}
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  structured data from day one.
                </span>
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/role-selection">
                <Button
                  size="lg"
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  Start Free Trial <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                <PlayIcon className="w-4 h-4 mr-2" /> Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">40%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Faster Consultations
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">30min</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Saved Daily
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">99.9%</div>
                <div className="text-xs text-muted-foreground mt-1">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">HIPAA</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Compliant
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-teal-100 dark:ring-teal-900">
              <img
                src="https://v3b.fal.media/files/b/tiger/4Aaws8gqX_jL_XZCFdEk0.jpg"
                alt="Indian doctor and patient professional consultation"
                className="w-full h-auto"
              />

              {/* Floating card */}
              <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 flex items-center gap-3 border border-teal-100 dark:border-teal-900">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <PlayIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    AI Transcription Active
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recording consultation...
                  </div>
                </div>
                <div className="flex gap-0.5 ml-4">
                  <div className="w-1 h-6 bg-teal-500 rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-4 bg-teal-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-8 bg-teal-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-5 bg-teal-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Why Healthcare Providers Choose Us - Keeping original for continuity */}
      <section className="relative bg-gradient-to-b from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 py-16">
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6">
              <SparklesIcon className="w-4 h-4" />
              Why Choose MediEase
            </div>
            <h2 className="text-5xl font-bold mb-6">
              Why Healthcare Providers{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Choose Us
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for efficiency, designed for care. Experience the difference
              with our unified platform.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">Faster Consults</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Reduce consultation time by 40% with AI-powered workflows
                    and instant access to patient history
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ZapIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">
                    Smart Workflow Automation
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Intelligent automation reduces manual tasks by 85%.
                    AI-powered workflows adapt to your practice needs
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-transparent hover:border-cyan-200 dark:hover:border-cyan-800">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <CheckCircle2Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">
                    Structured Data from Day One
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Automatically organize patient data with AI transcription
                    and smart categorization
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 rounded-2xl p-8 text-center border border-teal-100 dark:border-teal-900 hover:shadow-lg transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                2x
              </div>
              <div className="text-sm text-muted-foreground">
                Patient Throughput
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-2xl p-8 text-center border border-emerald-100 dark:border-emerald-900 hover:shadow-lg transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                85%
              </div>
              <div className="text-sm text-muted-foreground">
                Less Documentation Time
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/50 dark:to-teal-950/50 rounded-2xl p-8 text-center border border-cyan-100 dark:border-cyan-900 hover:shadow-lg transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-3">
                100%
              </div>
              <div className="text-sm text-muted-foreground">Data Accuracy</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-950/50 dark:to-teal-950/50 rounded-2xl p-8 text-center border border-purple-100 dark:border-purple-900 hover:shadow-lg transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-3">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">
                Support Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <SolutionsSection />

      {/* Complete Care Journey - Keeping original for continuity */}
      <section className="bg-teal-50/30 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">
              Complete <span className="text-teal-500">Care Journey</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From patient intake to follow-up, every step is streamlined and
              connected
            </p>
          </div>

          {/* Journey Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div
              className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200"
              style={{ top: "64px" }}
            ></div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
              {[
                {
                  icon: UsersIcon,
                  title: "Intake",
                  desc: "Patient registration and insurance verification",
                  color: "bg-teal-500",
                  number: "1",
                },
                {
                  icon: CalendarIcon,
                  title: "Visit",
                  desc: "Check-in and queue management",
                  color: "bg-emerald-500",
                  number: "2",
                },
                {
                  icon: MicIcon,
                  title: "Consultation",
                  desc: "AI-powered recording and transcription",
                  color: "bg-cyan-500",
                  number: "3",
                },
                {
                  icon: FileTextIcon,
                  title: "Documentation",
                  desc: "Structured notes and EHR updates",
                  color: "bg-teal-600",
                  number: "4",
                },
                {
                  icon: TrendingUpIcon,
                  title: "Follow-up",
                  desc: "Automated reminders and care plans",
                  color: "bg-emerald-600",
                  number: "5",
                },
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                    {/* Number Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                      {step.number}
                    </div>

                    <div
                      className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-4 mx-auto`}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-center mb-2">{step.title}</h3>
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              See the Complete Workflow{" "}
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Built for Every Role */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">
              Built for <span className="text-teal-500">Every Role</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences for administrators, healthcare providers, and
              front desk staff
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Clinic Administrator */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src="https://v3b.fal.media/files/b/elephant/6cXkcUeGi2JDy_oOaXjID.jpg"
                  alt="Clinic Administrator"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Clinic Administrator
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">
                  Manage staff, monitor operations, and access comprehensive
                  analytics
                </h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    Staff Management
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    Revenue Analytics
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    Appointment Overview
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    Compliance Reports
                  </li>
                </ul>
                <Link to="/admin-dashboard">
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                    Explore Admin View
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Healthcare Provider */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src="https://v3b.fal.media/files/b/tiger/uzg5SrOkJbhyda3pIX9-Y.jpg"
                  alt="Healthcare Provider"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4" />
                  Healthcare Provider
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">
                  Focus on patient care with AI-assisted documentation and
                  instant EHR access
                </h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Patient Dashboard
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    AI Transcription
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Quick Notes
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Treatment History
                  </li>
                </ul>
                <Link to="/doctor-dashboard">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    Explore Doctor View
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Front Desk */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src="https://v3b.fal.media/files/b/zebra/pDgXJCg1NQ69RPS2MOg-P.jpg"
                  alt="Front Desk Receptionist"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Front Desk
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">
                  Streamline patient intake, scheduling, and check-in processes
                </h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    Appointment Booking
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    Patient Check-in
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    Queue Management
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    Insurance Verification
                  </li>
                </ul>
                <Link to="/receptionist-dashboard">
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                    Explore Receptionist View
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="mt-12 text-center bg-teal-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">
              Designed for Modern Healthcare
            </h3>
            <p className="text-muted-foreground">
              Streamline your practice with role-based workflows
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <RoadmapSection />

      {/* AI That Works For You - Keeping original for continuity */}
      <section className="relative bg-gradient-to-b from-teal-50/30 via-white to-emerald-50/30 dark:from-teal-950/20 dark:via-slate-950 dark:to-emerald-950/20 py-16">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6 shadow-lg">
              <SparklesIcon className="w-4 h-4" />
              Powered by Advanced AI
            </div>
            <h2 className="text-5xl font-bold mb-6">
              AI That Works{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                For You
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              Transform your practice with intelligent automation that digitizes
              patient records, increases efficiency, and helps grow your clinic
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Image with overlay cards */}
            <div className="relative">
              {/* Decorative gradient orbs */}
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>

              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-teal-100 dark:ring-teal-900">
                <img
                  src="https://v3b.fal.media/files/b/kangaroo/Kp0H7oPaKGuf6Fx0Z0HC_.jpg"
                  alt="Indian doctor and staff using healthcare application"
                  className="w-full h-auto"
                />

                {/* Floating AI card */}
                <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-teal-100 dark:border-teal-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <MicIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        AI Transcription Active
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recording consultation...
                      </div>
                    </div>
                  </div>
                </div>
                {/* Patient Insights card */}
                <div className="absolute top-6 right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        Patient Insights
                      </div>
                      <div className="text-xs text-teal-600">
                        3 recommendations
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-teal-100 dark:border-teal-900">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0 border border-teal-100 dark:border-teal-800">
                    <MicIcon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3">
                      AI Medical Transcription
                    </h3>
                    <p className="text-base text-muted-foreground mb-4">
                      Record consultations and automatically generate structured
                      clinical notes with medical terminology accuracy
                    </p>
                    <div className="flex items-center gap-2 text-xs text-teal-600">
                      <SparklesIcon className="w-3 h-3" />
                      Save 30+ minutes per day on documentation
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-emerald-100 dark:border-emerald-900">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center flex-shrink-0 border border-emerald-100 dark:border-emerald-800">
                    <ClipboardListIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3">
                      Patient Overview Intelligence
                    </h3>
                    <p className="text-base text-muted-foreground mb-4">
                      Get instant AI-generated summaries of patient history,
                      medications, and risk factors
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <SparklesIcon className="w-3 h-3" />
                      Make informed decisions faster
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-cyan-100 dark:border-cyan-900">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/30 dark:to-teal-900/30 flex items-center justify-center flex-shrink-0 border border-cyan-100 dark:border-cyan-800">
                    <BarChart3Icon className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3">
                      Doctor Dashboard Analytics
                    </h3>
                    <p className="text-base text-muted-foreground mb-4">
                      Real-time insights on patient load, appointment
                      efficiency, and clinical outcomes
                    </p>
                    <div className="flex items-center gap-2 text-xs text-cyan-600">
                      <SparklesIcon className="w-3 h-3" />
                      Optimize clinic operations
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-purple-100 dark:border-purple-900">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-900/30 dark:to-teal-900/30 flex items-center justify-center flex-shrink-0 border border-purple-100 dark:border-purple-800">
                    <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3">
                      Increased Footfall
                    </h3>
                    <p className="text-base text-muted-foreground mb-4">
                      Digital records and faster service attract more patients
                      and improve satisfaction scores
                    </p>
                    <div className="flex items-center gap-2 text-xs text-purple-600">
                      <SparklesIcon className="w-3 h-3" />
                      Grow your practice by 25%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-900 dark:to-teal-950/30 rounded-2xl p-8 text-center shadow-lg border border-teal-100 dark:border-teal-900 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                98%
              </div>
              <div className="text-sm text-muted-foreground">
                Transcription Accuracy
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 rounded-2xl p-8 text-center shadow-lg border border-emerald-100 dark:border-emerald-900 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                30min
              </div>
              <div className="text-sm text-muted-foreground">Saved Per Day</div>
            </div>
            <div className="bg-gradient-to-br from-white to-cyan-50/50 dark:from-slate-900 dark:to-cyan-950/30 rounded-2xl p-8 text-center shadow-lg border border-cyan-100 dark:border-cyan-900 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-3">
                25%
              </div>
              <div className="text-sm text-muted-foreground">
                Practice Growth
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-950/30 rounded-2xl p-8 text-center shadow-lg border border-purple-100 dark:border-purple-900 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-3">
                100%
              </div>
              <div className="text-sm text-muted-foreground">
                Digital Records
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <SparklesIcon className="w-4 h-4 mr-2" /> Experience AI in Action
            </Button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <SecuritySection />

      {/* Compliance & Security - Keeping original for continuity */}
      <section
        className="relative bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 py-16"
        style={{ display: "none" }}
      >
        {/* Decorative background */}
        <div
          className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.4))]"
          style={{
            backgroundSize: "30px 30px",
            backgroundImage:
              "linear-gradient(to right, rgb(226 232 240 / 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgb(226 232 240 / 0.1) 1px, transparent 1px)",
          }}
        ></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-6 shadow-lg">
              <ShieldCheckIcon className="w-4 h-4" />
              Enterprise-Grade Security
            </div>
            <h2 className="text-5xl font-bold mb-6">
              Your Data is{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Safe & Compliant
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              Built with security at its core. We meet the highest standards for
              healthcare data protection.
            </p>
          </div>

          {/* Security Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Enterprise Authentication
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Multi-factor authentication with role-based access control and
                SSO integration
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  2FA/MFA Support
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  Role-Based Access
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  SSO Integration
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  Session Management
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">HIPAA Compliant</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Full compliance with healthcare data protection regulations and
                industry standards
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  End-to-End Encryption
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Data Privacy
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Secure Storage
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Regular Audits
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-6">
                <FileTextIcon className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Comprehensive Audit Logs
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Track every action with detailed audit trails for compliance and
                accountability
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Activity Tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Access Logs
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Change History
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Compliance Reports
                </li>
              </ul>
            </Card>
          </div>

          {/* Certified & Compliant */}
          <div className="bg-teal-50/50 rounded-3xl p-12 mb-12">
            <h3 className="text-2xl font-bold text-center mb-4">
              Certified & Compliant
            </h3>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Meeting global standards for healthcare data security
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-10 h-10 text-teal-600" />
                </div>
                <div className="font-bold text-lg mb-1">HIPAA</div>
                <div className="text-xs text-muted-foreground">
                  Health Insurance Portability and Accountability Act
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="font-bold text-lg mb-1">SOC 2</div>
                <div className="text-xs text-muted-foreground">
                  Service Organization Control 2
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-10 h-10 text-cyan-600" />
                </div>
                <div className="font-bold text-lg mb-1">GDPR</div>
                <div className="text-xs text-muted-foreground">
                  General Data Protection Regulation
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-10 h-10 text-purple-600" />
                </div>
                <div className="font-bold text-lg mb-1">ISO 27001</div>
                <div className="text-xs text-muted-foreground">
                  Information Security Management
                </div>
              </div>
            </div>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-teal-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold">256-bit Encryption</div>
              </div>
              <p className="text-xs text-muted-foreground">
                All data is encrypted in transit and at rest using industry
                standard AES-256 encryption
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <ActivityIcon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold">24/7 Security Monitoring</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Continuous monitoring and threat detection to protect your
                sensitive healthcare data
              </p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                  <CheckCircle2Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold">Zero Security Breaches</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Since our inception, we maintain a perfect security record with
                zero breaches
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold">Annual Security Audits</div>
              </div>
              <p className="text-xs text-muted-foreground">
                By independent firms to ensure we meet and exceed security
                standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Features & Roadmap Section - Keeping original for continuity */}
      <section className="bg-teal-50/30 py-12" style={{ display: "none" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-600 text-sm mb-6">
              <RocketIcon className="w-4 h-4" />
              Coming Soon
            </div>
            <h2 className="text-4xl font-bold mb-4">
              MediEase <span className="text-teal-500">Features & Roadmap</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              Comprehensive healthcare management features designed to transform
              your practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* E-Prescriptions */}
            <Card className="p-8 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Core Feature
              </div>
              <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center mb-6">
                <FileTextIcon className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">E-Prescriptions</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Integrated digital prescription system with medication tracking
                and drug interaction alerts
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  Digital Rx
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  Medication History
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  Drug Interactions
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                  Dosage Tracking
                </li>
              </ul>
              <Button
                variant="ghost"
                className="w-full mt-6 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              >
                Learn More <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Card>

            {/* Patient Portal */}
            <Card className="p-8 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Coming Q3 2024
              </div>
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                <UsersIcon className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Patient Portal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Comprehensive patient profiles with medical history, past
                events, and lab results from your clinic
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Patient Details
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Medical History
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Lab Results
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  Past Events
                </li>
              </ul>
              <Button
                variant="ghost"
                className="w-full mt-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                Learn More <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Card>

            {/* Telehealth via WhatsApp */}
            <Card className="p-8 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 right-4 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Coming Q4 2024
              </div>
              <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-6">
                <ActivityIcon className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Telehealth via WhatsApp
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                WhatsApp-based follow-up system for diagnosis feedback and
                report sharing to reduce unnecessary hospital visits
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  WhatsApp Integration
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Report Sharing
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Doctor Consultation
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="w-4 h-4 text-cyan-500" />
                  Follow-up Care
                </li>
              </ul>
              <Button
                variant="ghost"
                className="w-full mt-6 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
              >
                Learn More <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>

          {/* Designed for Your Practice Banner */}
          <div className="mt-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-12 text-white">
                <h3 className="text-3xl font-bold mb-4">
                  Designed for Your Practice
                </h3>
                <p className="text-white/90 mb-6 leading-relaxed">
                  MediEase is built specifically for clinics and hospitals,
                  focusing on streamlining patient care and reducing
                  administrative burden. Our platform grows with your practice.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2Icon className="w-5 h-5" />
                    All-in-one platform - no external integrations needed
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2Icon className="w-5 h-5" />
                    Customizable workflows for your clinic's needs
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2Icon className="w-5 h-5" />
                    Continuous improvements based on healthcare expertise
                  </li>
                </ul>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-teal-600 hover:bg-gray-100"
                >
                  Learn More About Features{" "}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="relative h-full min-h-[400px]">
                <img
                  src="https://v3b.fal.media/files/b/lion/-RGXiOTNkhggXVcusHUGQ.jpg"
                  alt="Modern healthcare practice"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Stay Updated */}
          <div className="mt-16 text-center">
            <Card className="max-w-md mx-auto p-8">
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to know when new features launch
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                  Subscribe
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Healthcare Practice?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of healthcare providers using MediEase to deliver
            better patient care with AI-powered solutions
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/role-selection">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-teal-600 hover:bg-gray-100"
              >
                Start Free Trial <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-teal-600"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="pricing" className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div>
                  <div className="font-bold text-lg">MediEase</div>
                  <div className="text-xs text-teal-400">
                    Your Health, Our Mission
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Transforming healthcare with AI and digital innovation for
                Indian clinics and hospitals.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#features" className="hover:text-teal-400">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-teal-400">
                    Solutions
                  </a>
                </li>
                <li>
                  <a href="#roadmap" className="hover:text-teal-400">
                    Roadmap
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-teal-400">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-teal-400">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal & Security</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    HIPAA Compliance
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2024 MediEase. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-teal-400">
                Twitter
              </a>
              <a href="#" className="hover:text-teal-400">
                LinkedIn
              </a>
              <a href="#" className="hover:text-teal-400">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
