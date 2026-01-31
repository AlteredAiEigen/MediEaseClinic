import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { post } from "@/lib/api-client";
import {
  BuildingIcon,
  HospitalIcon,
  UserIcon,
  LanguagesIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
} from "lucide-react";

export function SolutionsSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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
         "WhatsApp integration"
      ],
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
         "WhatsApp integration"
      ],
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
         "WhatsApp integration"
      ],
      color: "from-cyan-500 to-teal-500",
      popular: false,
    },
    
  ];

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    providerName: "",
    query: "",
  });

  const resetForm = () =>
    setContactForm({
      name: "",
      email: "",
      phone: "",
      providerName: "",
      query: "",
    });

  const handleDialogChange = (open: boolean) => {
    setIsContactOpen(open);
    if (!open) {
      resetForm();
      setSelectedSolution(null);
    }
  };

  const handleGetStarted = (solutionTitle: string) => {
    setSelectedSolution(solutionTitle);
    setIsContactOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.phone.trim() || !contactForm.providerName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your name, email, phone number, and clinic/hospital name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Include selected solution option in the query
      const queryText = selectedSolution 
        ? `Selected Solution: ${selectedSolution}\n\n${contactForm.query.trim() || "No additional details provided."}`
        : contactForm.query.trim() || "No additional details provided.";
      
      await post("/api/contact", {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        providerName: contactForm.providerName.trim(),
        query: queryText,
      });
      
      // Close the contact form dialog
      handleDialogChange(false);
      
      // Show success acknowledgment dialog
      setShowSuccessDialog(true);
    } catch (err) {
      toast({
        title: "Unable to send message",
        description:
          err instanceof Error ? err.message : "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages = [
    "English",
    "हिंदी (Hindi)",
    "ਪੰਜਾਬੀ (Punjabi)",
    "मराठी (Marathi)",
    "తెలుగు (Telugu)",
    "বাংলা (Bengali)",
    "தமிழ் (Tamil)",
    "ગુજરાતી (Gujarati)",
    "ಕನ್ನಡ (Kannada)",
    "മലയാളം (Malayalam)",
  ];

  return (
    <section
      id="pricing"
      className="relative bg-gradient-to-b from-teal-50/30 to-white dark:from-teal-950/20 dark:to-slate-950 py-20 lg:py-24"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-6 shadow-lg">
            <HospitalIcon className="w-4 h-4" />
            Tailored for Every Practice
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Solutions for{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Every Healthcare Setup
            </span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            AI transcription in 15+ languages. Voice to structured notes. Automatic updates.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20">
          {solutions.map((solution, index) => (
            <Card
              key={index}
              className={`relative p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm ${
                solution.popular
                  ? "border-2 border-teal-500 dark:border-teal-400 shadow-xl"
                  : "border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800"
              }`}
            >
              {solution.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                  Most Popular
                </div>
              )}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}
              >
                <solution.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{solution.title}</h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {solution.description}
              </p>
              <ul className="space-y-3 mb-6">
                {solution.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2Icon className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />

                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-6 border-t border-border">
                <Button
                  className={`w-full font-semibold ${
                    solution.popular
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                      : "bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 hover:scale-105"
                  } transition-all duration-300`}
                  onClick={() => handleGetStarted(solution.title)}
                >
                  Get Started <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Multilingual Transcription Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-950/30 dark:to-teal-950/30 rounded-3xl p-12 mb-20 border border-purple-100 dark:border-purple-900">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <LanguagesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Multilingual Transcription</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Real-time consultation transcription across India’s major languages. We generate structured clinical notes and update patient information automatically after every visit.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {languages.map((lang) => (
                  <div
                    key={lang}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-border"
                  >
                    <CheckCircle2Icon className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-semibold">{lang}</span>
                  </div>
                ))}
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
       


        {/* Success Acknowledgment Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500">
                <CheckCircle2Icon className="w-10 h-10 text-white" />
              </div>
              <DialogTitle className="text-center text-2xl">Thank You!</DialogTitle>
              <DialogDescription className="text-center text-base pt-2">
                We've received your inquiry and our team is excited to connect with you.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p className="text-center text-muted-foreground leading-relaxed">
                Please hold tight—we'll be reaching out to you within the next <span className="font-semibold text-teal-600">24 hours</span> to discuss how MediEase can best serve your practice.
              </p>
              <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-teal-700 dark:text-teal-300 text-center">
                  <span className="font-semibold">What's next?</span> Our team will review your requirements and prepare a personalized solution for your healthcare setup.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setShowSuccessDialog(false)}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                Got it, thanks!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isContactOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share your details</DialogTitle>
              <DialogDescription>
                {selectedSolution
                  ? `Let us know how we can help you with ${selectedSolution}.`
                  : "Tell us more about your requirements and we will reach out shortly."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  value={contactForm.name}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                  placeholder="Dr. Aditi Sharma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email ID</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                  placeholder="name@clinic.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Number</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={contactForm.phone}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-provider">Clinic/Hospital Name</Label>
                <Input
                  id="contact-provider"
                  value={contactForm.providerName}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, providerName: event.target.value }))
                  }
                  required
                  placeholder="Your clinic or hospital name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-query">Query</Label>
                <Textarea
                  id="contact-query"
                  value={contactForm.query}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, query: event.target.value }))
                  }
                  rows={4}
                  placeholder="Share your requirements or questions..."
                />
              </div>
              {selectedSolution && (
                <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg p-3">
                  <p className="text-sm text-teal-700 dark:text-teal-300">
                    <span className="font-semibold">Selected Solution:</span> {selectedSolution}
                  </p>
                </div>
              )}
              <DialogFooter className="flex flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
