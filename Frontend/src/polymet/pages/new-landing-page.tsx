import { Link } from "react-router-dom";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BrainIcon,
  MicIcon,
  DatabaseIcon,
  ActivityIcon,
  ClipboardCheckIcon,
  UserCheckIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
} from "lucide-react";

export function NewLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFF] via-white to-[#A7F5EB]/10">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <MediEaseLogo size="md" />

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-[#00C4B3]">
              Features
            </a>
            <a href="#journey" className="text-sm hover:text-[#00C4B3]">
              Care Journey
            </a>
            <a href="#pricing" className="text-sm hover:text-[#00C4B3]">
              Pricing
            </a>
            <Link to="/role-selection">
              <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C4B3]/10 border border-[#00C4B3]/20">
              <ActivityIcon className="w-4 h-4 text-[#00C4B3]" />

              <span className="text-sm font-medium text-[#00C4B3]">
                AI-Powered Healthcare
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Transform Your Clinic with{" "}
              <span className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                AI & Digital Dignity
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Digitize patient data, transcribe conversations, and leverage AI
              to provide better care with complete patient history at your
              fingertips.
            </p>
            <div className="flex gap-4">
              <Link to="/role-selection">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white"
                >
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="relative">
            <Card className="p-8 bg-gradient-to-br from-[#00C4B3]/5 to-[#10b981]/5 border-[#00C4B3]/20">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop"
                alt="Healthcare"
                className="rounded-lg w-full"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Why Healthcare Providers Choose Us
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed for modern healthcare
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#00C4B3]/10 flex items-center justify-center mb-4">
                <BrainIcon className="w-6 h-6 text-[#00C4B3]" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Intelligent insights from patient history to support better
                diagnosis and treatment decisions.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#10b981]/10 flex items-center justify-center mb-4">
                <MicIcon className="w-6 h-6 text-[#10b981]" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Conversation Transcription
              </h3>
              <p className="text-muted-foreground">
                Automatically capture and transcribe doctor-patient
                conversations for accurate records.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#22d3ee]/10 flex items-center justify-center mb-4">
                <DatabaseIcon className="w-6 h-6 text-[#22d3ee]" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Digital Patient Records
              </h3>
              <p className="text-muted-foreground">
                Complete digitization of patient data with secure,
                HIPAA-compliant storage.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Complete Care Journey */}
      <section id="journey" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Complete Care Journey</h2>
            <p className="text-xl text-muted-foreground">
              Streamlined workflow from registration to follow-up
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C4B3] to-[#10b981] flex items-center justify-center mx-auto mb-4">
                <UserCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">Registration</h3>
              <p className="text-sm text-muted-foreground">
                Quick patient onboarding with digital forms
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C4B3] to-[#10b981] flex items-center justify-center mx-auto mb-4">
                <ClipboardCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">Consultation</h3>
              <p className="text-sm text-muted-foreground">
                AI-assisted diagnosis with conversation transcription
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C4B3] to-[#10b981] flex items-center justify-center mx-auto mb-4">
                <BrainIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent insights from patient history
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C4B3] to-[#10b981] flex items-center justify-center mx-auto mb-4">
                <CalendarCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">Follow-up</h3>
              <p className="text-sm text-muted-foreground">
                Automated reminders and continuous care
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your clinic
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-4xl font-bold mb-4">
                $99
                <span className="text-lg text-muted-foreground">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> Up to
                  100 patients
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> Basic
                  AI analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> Email
                  support
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </Card>
            <Card className="p-8 border-[#00C4B3] border-2 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white px-4 py-1 rounded-full text-sm">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-4xl font-bold mb-4">
                $299
                <span className="text-lg text-muted-foreground">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> Up to
                  500 patients
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" />{" "}
                  Advanced AI analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" />{" "}
                  Conversation transcription
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" />{" "}
                  Priority support
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white">
                Get Started
              </Button>
            </Card>
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">Custom</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" />{" "}
                  Unlimited patients
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> Full AI
                  suite
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> Custom
                  integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#00C4B3]" /> 24/7
                  support
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold mb-2">1,200+</p>
              <p className="text-white/80">Active Patients</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">50+</p>
              <p className="text-white/80">Medical Staff</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">98%</p>
              <p className="text-white/80">Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">24/7</p>
              <p className="text-white/80">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <MediEaseLogo size="md" className="mb-4" />

              <p className="text-sm text-slate-400">
                Transforming healthcare with AI and digital innovation.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
                <li>
                  <a href="#journey">Care Journey</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Terms</a>
                </li>
                <li>
                  <a href="#">HIPAA</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            © 2024 MediEase Clinic. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
