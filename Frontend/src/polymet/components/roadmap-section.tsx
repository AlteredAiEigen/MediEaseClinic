import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { post } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Network,
} from "lucide-react";

export function RoadmapSection() {
  const { toast } = useToast();
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [isSubmittingSubscribe, setIsSubmittingSubscribe] = useState(false);
  const [initiativeDialogOpen, setInitiativeDialogOpen] = useState(false);

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
        source: "roadmap_section",
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
  const upcomingFeatures = [
    {
      icon: CreditCardIcon,
      title: "Integration with Ayushman Card",
      description:
        "Allow patients to directly check if tests or medicines are covered under the Ayushman card scheme along with coverage limits, improving transparency and cost management.",
      timeline: "Q4 2026",
      status: "Planned",
      features: [
        "Real-time Ayushman card eligibility verification",
        "Coverage limit checking for tests and medicines",
        "Transparent cost management",
        "Direct claim processing",
      ],

      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CreditCardIcon,
      title: "Linkage to Private Insurance",
      description:
        "Enable seamless integration with private insurance providers for better patient benefits and billing processing.",
      timeline: "Q4 2026",
      status: "Planned",
      features: [
        "Direct integration with major private insurers",
        "Real-time eligibility verification",
        "Automated claim submission",
        "Seamless billing processing",
      ],

      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Network,
      title: "Cross-Hospital Patient Data Sharing",
      description:
        "Allow authorized healthcare providers across hospitals to search and view patient details securely, facilitating continuity of care.",
      timeline: "Q1 2025",
      status: "Research",
      features: [
        "Secure cross-hospital patient data access",
        "Authorized provider search functionality",
        "Continuity of care facilitation",
        "HIPAA-compliant data sharing",
      ],

      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: GraduationCapIcon,
      title: "Medical Student Training with Simulated Cases",
      description:
        "Use recorded patient cases to create simulated diagnosis scenarios for medical students, enriching their learning experience with diverse clinical cases.",
      timeline: "Q1 2026",
      status: "Research",
      features: [
        "Anonymized patient case simulations",
        "Diverse clinical scenarios",
        "AI-powered diagnosis training",
        "Interactive learning modules",
      ],

      color: "from-orange-500 to-red-500",
    },
  ];

  const educationInitiative = {
    title: "Medical Student Training with Simulated Cases",
    description:
      "Use recorded patient cases to create simulated diagnosis scenarios for medical students, enriching their learning experience with diverse clinical cases.",
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
                    Coming Q1 2026
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
                onClick={() => setInitiativeDialogOpen(true)}
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
        <div id="roadmap-subscribe" className="text-center">
          <Card className="max-w-2xl mx-auto p-12">
            <SparklesIcon className="w-12 h-12 text-teal-600 mx-auto mb-6" />

            <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Be the first to know when new features launch. Subscribe to our
              product updates and get early access to beta features.
            </p>
            <form onSubmit={handleSubscribeSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-background"
                required
                disabled={isSubmittingSubscribe}
              />

              <Button
                type="submit"
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                disabled={isSubmittingSubscribe}
              >
                {isSubmittingSubscribe ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Join 5,000+ healthcare providers already subscribed
            </p>
          </Card>
        </div>
      </div>

      {/* Medical Education Initiative Details Dialog */}
      <Dialog open={initiativeDialogOpen} onOpenChange={setInitiativeDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <GraduationCapIcon className="w-8 h-8 text-teal-600" />
              Medical Student Training Initiative
            </DialogTitle>
            <DialogDescription className="text-base">
              Transforming medical education through AI-powered clinical simulations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-teal-700">Overview</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our Medical Student Training Initiative leverages anonymized patient cases from MediEase clinics
                to create realistic clinical scenarios. This program bridges the gap between theoretical knowledge
                and practical application, providing medical students with hands-on diagnostic experience in a
                safe, controlled environment.
              </p>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-teal-700">Key Features</h3>
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 bg-teal-50 rounded-lg">
                  <BrainIcon className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">AI-Powered Case Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Advanced algorithms create diverse clinical scenarios based on real patient data,
                      ensuring comprehensive coverage of medical conditions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-emerald-50 rounded-lg">
                  <SparklesIcon className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Interactive Learning Platform</h4>
                    <p className="text-sm text-muted-foreground">
                      Students can interact with virtual patients, order tests, and receive
                      AI-powered feedback on their diagnostic reasoning.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-blue-50 rounded-lg">
                  <GraduationCapIcon className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Progressive Difficulty Levels</h4>
                    <p className="text-sm text-muted-foreground">
                      From basic symptom recognition to complex multi-system disorders,
                      accommodating students at all levels of training.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-teal-700">Benefits for Medical Education</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Access to thousands of anonymized real-world cases</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Safe learning environment without patient risk</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Immediate AI feedback on clinical decision-making</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Cost-effective alternative to traditional clinical rotations</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Scalable solution for institutions with limited clinical sites</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-teal-700">Expected Launch: Q1 2026</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pilot program with select medical colleges, expanding to nationwide availability.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setInitiativeDialogOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              onClick={() => {
                setInitiativeDialogOpen(false);
                // Scroll to subscribe section
                document.getElementById('roadmap-subscribe')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Notified When Available
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
