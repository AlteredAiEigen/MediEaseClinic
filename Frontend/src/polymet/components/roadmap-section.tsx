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

 
}
