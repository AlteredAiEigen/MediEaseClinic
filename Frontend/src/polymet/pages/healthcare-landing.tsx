import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Loader2Icon,
  MenuIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { useAuth } from "@/context/auth-context";
import { FeaturesSection } from "@/polymet/components/features-section";
import { SolutionsSection } from "@/polymet/components/solutions-section";
import { SecuritySection } from "@/polymet/components/security-section";
import { RoadmapSection } from "@/polymet/components/roadmap-section";
import { useToast } from "@/components/ui/use-toast";
import { post } from "@/lib/api-client";

type LeadFormState = {
  name: string;
  email: string;
  phone: string;
  providerName: string;
  query: string;
};

const emptyLeadForm: LeadFormState = {
  name: "",
  email: "",
  phone: "",
  providerName: "",
  query: "",
};

export function HealthcareLanding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [isSubmittingSubscribe, setIsSubmittingSubscribe] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Determine where logo should link based on auth status
  const getLogoLink = () => {
    if (!user) return "#"; // Stay on landing page and scroll to top
    switch (user.role) {
      case "admin":
        return "/admin-dashboard";
      case "doctor":
        return "/doctor-dashboard";
      case "receptionist":
        return "/receptionist-dashboard";
      default:
        return "#";
    }
  };

  const handleLeadFieldChange = (field: keyof LeadFormState, value: string) => {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !leadForm.name.trim() ||
      !leadForm.email.trim() ||
      !leadForm.phone.trim() ||
      !leadForm.providerName.trim()
    ) {
      toast({
        title: "Missing information",
        description: "Please provide your name, email, phone number, and clinic/hospital name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingLead(true);
      await post("/api/contact", {
        name: leadForm.name.trim(),
        email: leadForm.email.trim(),
        phone: leadForm.phone.trim(),
        providerName: leadForm.providerName.trim(),
        query: leadForm.query.trim() || "No additional details provided.",
      });
      toast({
        title: "Thanks for reaching out!",
        description: "Our team will get back to you shortly.",
      });
      setLeadModalOpen(false);
      setLeadForm(emptyLeadForm);
    } catch (err) {
      toast({
        title: "Unable to send message",
        description:
          err instanceof Error ? err.message : "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleSubscribeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subscribeEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingSubscribe(true);
      await post("/api/subscribe", {
        email: subscribeEmail.trim(),
        source: "landing_page_footer",
      });
      toast({
        title: "Subscribed successfully!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setSubscribeEmail("");
    } catch (err) {
      toast({
        title: "Subscription failed",
        description:
          err instanceof Error ? err.message : "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSubscribe(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to={getLogoLink()} onClick={() => !user && window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <MediEaseLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('roadmap')}
              className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            >
              Roadmap
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            >
              Security
            </button>
            <Link
              to="/about-us#founders"
              className="text-sm font-medium text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            >
              About Us
            </Link>
            <Link to="/role-selection">
              <Button
                variant="ghost"
                size="default"
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 font-medium px-4 py-2 transition-all duration-200"
              >
                Sign In
              </Button>
            </Link>
            <Button
              size="default"
              onClick={() => setLeadModalOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium px-6 py-2"
            >
              Book a Demo
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navigate to different sections
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <button
                  onClick={() => {
                    scrollToSection('features');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-base font-medium text-muted-foreground hover:text-teal-600 transition-colors py-2"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection('pricing');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-base font-medium text-muted-foreground hover:text-teal-600 transition-colors py-2"
                >
                  Pricing
                </button>
                <button
                  onClick={() => {
                    scrollToSection('roadmap');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-base font-medium text-muted-foreground hover:text-teal-600 transition-colors py-2"
                >
                  Roadmap
                </button>
                <button
                  onClick={() => {
                    scrollToSection('security');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-base font-medium text-muted-foreground hover:text-teal-600 transition-colors py-2"
                >
                  Security
                </button>
                <Link
                  to="/about-us#founders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left text-base font-medium text-muted-foreground hover:text-teal-600 transition-colors py-2"
                >
                  About Us
                </Link>
                <div className="border-t pt-4 mt-4 space-y-3">
                  <Link to="/role-selection" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setLeadModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                  >
                    Book a Demo
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[82vh] flex items-center overflow-hidden">
        {/* Full-size blurred background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://v3b.fal.media/files/b/tiger/4Aaws8gqX_jL_XZCFdEk0.jpg"
            alt="Indian doctor and patient professional consultation"
            className="w-full h-full object-cover blur-3xl scale-110 opacity-15"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white/85 dark:from-slate-950/92 dark:via-slate-950/80 dark:to-slate-950/92"></div>
        </div>
        
        {/* Content - Full Width */}
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24 relative z-10 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
              <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                    All-in-One Platform
                  </span>
                  <br />
                  <span className="text-foreground">Transform Today. Scale Tomorrow.</span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Real-time patient flow. AI-powered transcription. Built for Indian clinics.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    onClick={() => setLeadModalOpen(true)}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 w-full sm:w-auto rounded-xl"
                  >
                    Book a Demo <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-teal-200/40 dark:border-teal-800/40 w-full max-w-md">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <ShieldCheckIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        HIPAA Compliant
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Protected Health Information
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-teal-200/40 dark:border-teal-800/40 bg-white/70 dark:bg-slate-900/70 px-4 py-3 text-sm font-semibold text-foreground text-center">
                      End-to-end encryption
                    </div>
                    <div className="rounded-xl border border-emerald-200/40 dark:border-emerald-800/40 bg-white/70 dark:bg-slate-900/70 px-4 py-3 text-sm font-semibold text-foreground text-center">
                      99.9% uptime
                    </div>
                    <div className="rounded-xl border border-cyan-200/40 dark:border-cyan-800/40 bg-white/70 dark:bg-slate-900/70 px-4 py-3 text-sm font-semibold text-foreground text-center">
                      Audit logs
                    </div>
                    <div className="rounded-xl border border-teal-200/40 dark:border-teal-800/40 bg-white/70 dark:bg-slate-900/70 px-4 py-3 text-sm font-semibold text-foreground text-center">
                      Role-based access
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div id="features">
        <FeaturesSection />
      </div>

      {/* Why Healthcare Providers Choose Us - Keeping original for continuity */}
      <section className="relative bg-gradient-to-b from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 py-16 sm:py-20 lg:py-24">
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.4))]"
          style={{
            backgroundSize: "30px 30px",
            backgroundImage:
              "linear-gradient(to right, rgb(226 232 240 / 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgb(226 232 240 / 0.1) 1px, transparent 1px)",
          }}
        ></div>
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              Why Choose MediEase
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 px-4">
              Why Healthcare Providers{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Choose Us
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto px-4">
              Built for efficiency. Designed for care.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            <Card className="group p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800 rounded-2xl">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <ClockIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-foreground">Faster Consults</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    40% faster with AI workflows and instant patient history
                  </p>
                </div>
              </div>
            </Card>

            <Card className="group p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 rounded-2xl">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <ZapIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    Smart Workflow Automation
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Intelligent automation reduces manual tasks by 85%.
                    AI-powered workflows adapt to your practice needs
                  </p>
                </div>
              </div>
            </Card>

            <Card className="group p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 rounded-2xl">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <CheckCircle2Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    Structured Data
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Auto-organized patient data with AI transcription
                  </p>
                </div>
              </div>
            </Card>

          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-teal-100 dark:border-teal-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                2x
              </div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">
                Patient Throughput
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-emerald-100 dark:border-emerald-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                85%
              </div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">
                Less Documentation Time
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/50 dark:to-teal-950/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-cyan-100 dark:border-cyan-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-3">
                100%
              </div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Data Accuracy</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-950/50 dark:to-teal-950/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-purple-100 dark:border-purple-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-3">
                24/7
              </div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">
                Support Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <div id="solutions">
        <SolutionsSection />
      </div>

      {/* Complete Care Journey */}
      <section className="bg-gradient-to-b from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
              Complete <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Care Journey</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Streamlined from intake to follow-up
            </p>
          </div>

          {/* Zigzag Flowchart */}
          <div className="relative max-w-4xl mx-auto">
            <div className="flex flex-col gap-6 relative">
              {[
                {
                  icon: UsersIcon,
                  title: "Intake",
                  desc: "Patient registration and insurance verification",
                  bgColor: "bg-orange-500",
                  borderColor: "border-orange-600",
                  stepLabel: "STEP ONE",
                  number: "1",
                },
                {
                  icon: CalendarIcon,
                  title: "Visit",
                  desc: "Check-in and queue management",
                  bgColor: "bg-purple-500",
                  borderColor: "border-purple-600",
                  stepLabel: "STEP TWO",
                  number: "2",
                },
                {
                  icon: MicIcon,
                  title: "Consultation",
                  desc: "AI-powered triaging and transcription",
                  bgColor: "bg-pink-500",
                  borderColor: "border-pink-600",
                  stepLabel: "STEP THREE",
                  number: "3",
                },
                {
                  icon: FileTextIcon,
                  title: "Documentation",
                  desc: "Structured notes and EMR updates",
                  bgColor: "bg-teal-500",
                  borderColor: "border-teal-600",
                  stepLabel: "STEP FOUR",
                  number: "4",
                },
                {
                  icon: TrendingUpIcon,
                  title: "Follow-up",
                  desc: "Automated reminders and care plans",
                  bgColor: "bg-emerald-500",
                  borderColor: "border-emerald-600",
                  stepLabel: "STEP FIVE",
                  number: "5",
                },
              ].map((step, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={i} className={`relative group z-10 ${isEven ? 'flex justify-start' : 'flex justify-end'}`}>
                    {/* Elegant Flowing Arrow Connector */}
                    {i < 4 && (
                      <div className={`absolute top-full ${isEven ? 'left-0' : 'right-0'} z-0 w-1/2 h-20`}>
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 300 100"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id={`flow-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
                              <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                            </linearGradient>
                            <filter id={`arrow-shadow-${i}`}>
                              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.3"/>
                            </filter>
                            <marker
                              id={`flow-arrow-${i}`}
                              markerWidth="14"
                              markerHeight="14"
                              refX="12"
                              refY="7"
                              orient="auto"
                              markerUnits="strokeWidth"
                            >
                              <path
                                d="M 0 0 L 14 7 L 0 14 L 4 7 Z"
                                fill="url(#flow-gradient-${i})"
                                filter={`url(#arrow-shadow-${i})`}
                              />
                            </marker>
                          </defs>
                          {/* Elegant flowing curve with smooth transitions */}
                          <path
                            d={isEven 
                              ? "M 15 8 C 50 15, 80 35, 120 50 C 160 65, 200 75, 285 92" 
                              : "M 285 8 C 250 15, 220 35, 180 50 C 140 65, 100 75, 15 92"}
                            fill="none"
                            stroke={`url(#flow-gradient-${i})`}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            markerEnd={`url(#flow-arrow-${i})`}
                            filter={`url(#arrow-shadow-${i})`}
                            className="group-hover:stroke-[5] transition-all duration-500 ease-in-out animate-pulse"
                          />
                          {/* Subtle glow effect for depth */}
                          <path
                            d={isEven 
                              ? "M 15 8 C 50 15, 80 35, 120 50 C 160 65, 200 75, 285 92" 
                              : "M 285 8 C 250 15, 220 35, 180 50 C 140 65, 100 75, 15 92"}
                            fill="none"
                            stroke="#2dd4bf"
                            strokeWidth="6"
                            strokeLinecap="round"
                            opacity="0.15"
                            className="blur-md"
                          />
                        </svg>
                      </div>
                    )}
                    
                    <div className={`relative ${step.bgColor} rounded-xl border-2 ${step.borderColor} p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full max-w-xs group`}>
                      {/* Step Label */}
                      <div className="text-white/90 text-xs font-bold uppercase tracking-wider mb-3">
                        {step.stepLabel}
                      </div>
                      
                      {/* Number Badge */}
                      <div className={`absolute top-4 right-4 w-10 h-10 ${step.bgColor} border-2 border-white rounded-lg flex items-center justify-center text-white text-base font-extrabold shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {step.number}
                      </div>

                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 border-2 border-white/30 group-hover:bg-white/30 transition-colors duration-300">
                        <step.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-3">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-white/95 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Built for Every Role */}
      <section className="bg-white dark:bg-slate-950 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
              Built for <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Every Role</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Tailored for every healthcare professional
            </p>
          </div>

          <Tabs defaultValue="admin" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 dark:bg-slate-900 p-1.5 rounded-xl mb-10 shadow-lg">
              <TabsTrigger 
                value="admin" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-slate-100 transition-all duration-300 rounded-lg font-medium py-3"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Clinic Administrator
              </TabsTrigger>
              <TabsTrigger 
                value="doctor"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-slate-100 transition-all duration-300 rounded-lg font-medium py-3"
              >
                <ActivityIcon className="w-4 h-4 mr-2" />
                Healthcare Provider
              </TabsTrigger>
              <TabsTrigger 
                value="receptionist"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-slate-100 transition-all duration-300 rounded-lg font-medium py-3"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Front Desk
              </TabsTrigger>
            </TabsList>

            {/* Clinic Administrator Tab */}
            <TabsContent value="admin" className="mt-0">
              <Card className="overflow-hidden border-2 border-teal-200 dark:border-teal-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <img
                      src="https://v3b.fal.media/files/b/elephant/6cXkcUeGi2JDy_oOaXjID.jpg"
                      alt="Clinic Administrator"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <SettingsIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">Clinic Administrator</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground leading-tight">
                      Manage staff, operations, and analytics
                    </h3>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
                        <span>Staff Management</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
                        <span>Revenue Analytics</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
                        <span>Appointment Overview</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
                        <span>Compliance Reports</span>
                      </li>
                    </ul>
                    <Link to="/admin-dashboard">
                      <Button size="lg" className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold py-6">
                        Explore Admin View <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Healthcare Provider Tab */}
            <TabsContent value="doctor" className="mt-0">
              <Card className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <img
                      src="https://v3b.fal.media/files/b/tiger/uzg5SrOkJbhyda3pIX9-Y.jpg"
                      alt="Healthcare Provider"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <ActivityIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Healthcare Provider</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground leading-tight">
                      AI-assisted documentation and instant EHR access
                    </h3>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>Patient Dashboard</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>AI Transcription</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>Quick Notes</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>Treatment History</span>
                      </li>
                    </ul>
                    <Link to="/doctor-dashboard">
                      <Button size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold py-6">
                        Explore Doctor View <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Front Desk Tab */}
            <TabsContent value="receptionist" className="mt-0">
              <Card className="overflow-hidden border-2 border-cyan-200 dark:border-cyan-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <img
                      src="https://v3b.fal.media/files/b/zebra/pDgXJCg1NQ69RPS2MOg-P.jpg"
                      alt="Front Desk Receptionist"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <UserIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">Front Desk</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground leading-tight">
                      Streamline intake, scheduling, and check-in
                    </h3>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                        <span>Appointment Booking</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                        <span>Patient Check-in</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                        <span>Queue Management</span>
                      </li>
                      <li className="flex items-center gap-3 text-base text-muted-foreground">
                        <CheckCircle2Icon className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                        <span>Insurance Verification</span>
                      </li>
                    </ul>
                    <Link to="/receptionist-dashboard">
                      <Button size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold py-6">
                        Explore Receptionist View <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Roadmap Section */}
      <div id="roadmap">
        <RoadmapSection />
      </div>



      {/* Security Section */}
      <div id="security">
        <SecuritySection />
      </div>

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


          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
              <form onSubmit={handleSubscribeSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  disabled={isSubmittingSubscribe}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={isSubmittingSubscribe}
                >
                  {isSubmittingSubscribe ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 text-white py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl sm:text-2xl mb-10 text-white/95 max-w-2xl mx-auto">
            Join thousands using MediEase for better patient care
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setLeadModalOpen(true)}
              className="bg-white text-teal-600 hover:bg-gray-50 hover:scale-105 px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 w-full sm:w-auto"
            >
              Book a Demo <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">M</span>
                </div>
                <div>
                  <div className="font-bold text-xl">MediEase</div>
                  <div className="text-xs text-teal-400 font-medium">
                    Your Health, Our Mission
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Transforming healthcare with AI and digital innovation for
                Indian clinics and hospitals.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-5 text-white">Product</h4>
              <ul className="space-y-3 text-sm sm:text-base text-slate-400">
                <li>
                  <a href="#features" className="hover:text-teal-400 transition-colors duration-200">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-teal-400 transition-colors duration-200">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#roadmap" className="hover:text-teal-400 transition-colors duration-200">
                    Roadmap
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLeadModalOpen(true)}
                    className="hover:text-teal-400 text-left w-full transition-colors duration-200"
                  >
                    Book a Demo
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-5 text-white">Company</h4>
              <ul className="space-y-3 text-sm sm:text-base text-slate-400">
                <li>
                  <Link to="/about-us#founders" className="hover:text-teal-400 transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-teal-400 transition-colors duration-200">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-5 text-white">Legal</h4>
              <ul className="space-y-3 text-sm sm:text-base text-slate-400">
                <li>
                  <Link to="/terms-of-service" className="hover:text-teal-400 transition-colors duration-200">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-teal-400 transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 sm:pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm sm:text-base text-slate-400">
              © 2025 MediEase. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm sm:text-base text-slate-400">
              <a
                href="https://www.linkedin.com/company/medieaseclinic/?lipi=urn%3Ali%3Apage%3Ad_flagship3_company%3Bm0xjg1BkQ9K62D64DBOqfQ%3D%3D"
                target="_blank"
                rel="noreferrer"
                className="hover:text-teal-400 transition-colors duration-200"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl sm:text-3xl font-bold">Tell us about your clinic</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Share your details and our team will reach out to schedule a personalized walkthrough.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name" className="text-sm font-semibold">Full Name</Label>
                <Input
                  id="lead-name"
                  value={leadForm.name}
                  onChange={(event) => handleLeadFieldChange("name", event.target.value)}
                  placeholder="Dr. Aditi Sharma"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={leadForm.email}
                  onChange={(event) => handleLeadFieldChange("email", event.target.value)}
                  placeholder="you@clinic.com"
                  required
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-provider" className="text-sm font-semibold">Clinic/Hospital Name</Label>
                <Input
                  id="lead-provider"
                  value={leadForm.providerName}
                  onChange={(event) => handleLeadFieldChange("providerName", event.target.value)}
                  placeholder="MediCare Hospital"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-phone" className="text-sm font-semibold">Phone Number</Label>
                <Input
                  id="lead-phone"
                  value={leadForm.phone}
                  onChange={(event) => handleLeadFieldChange("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-query" className="text-sm font-semibold">Tell us more</Label>
              <Textarea
                id="lead-query"
                rows={5}
                value={leadForm.query}
                onChange={(event) => handleLeadFieldChange("query", event.target.value)}
                placeholder="Number of providers, current systems, key pain points..."
                className="resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLeadModalOpen(false)}
                disabled={isSubmittingLead}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl px-8 font-semibold" 
                disabled={isSubmittingLead}
              >
                {isSubmittingLead ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
