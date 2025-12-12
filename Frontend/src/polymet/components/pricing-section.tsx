import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  CheckCircle2Icon,
  XIcon,
  SparklesIcon,
  BuildingIcon,
  HospitalIcon,
  UserIcon,
  ArrowRightIcon,
  IndianRupeeIcon,
} from "lucide-react";

export function PricingSection() {
  const plans = [
    {
      name: "Solo Practitioner",
      icon: UserIcon,
      price: "₹499",
      period: "/month",
      description: "Perfect for individual doctors starting their practice",
      popular: false,
      features: [
        { name: "Up to 50 patients/month", included: true },
        { name: "Basic EHR & patient records", included: true },
        { name: "Appointment booking", included: true },
        { name: "E-prescriptions", included: true },
        { name: "Patient communication", included: true },
        { name: "Mobile app access", included: true },
        { name: "Email support", included: true },
        { name: "AI transcription (100 min/month)", included: true },
        { name: "Multi-doctor support", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Priority support", included: false },
      ],

      color: "from-cyan-500 to-teal-500",
      buttonText: "Contact Us",
    },
    {
      name: "Small Clinic",
      icon: BuildingIcon,
      price: "₹999",
      period: "/month",
      description: "Ideal for clinics with 1-5 doctors",
      popular: true,
      features: [
        { name: "Up to 200 patients/month", included: true },
        { name: "Complete EHR system", included: true },
        { name: "Multi-doctor scheduling", included: true },
        { name: "Digital prescriptions", included: true },
        { name: "Queue management", included: true },
        { name: "Billing & invoicing", included: true },
        { name: "AI transcription (500 min/month)", included: true },
        { name: "Basic analytics dashboard", included: true },
        { name: "WhatsApp integration", included: true },
        { name: "Priority email support", included: true },
        { name: "Staff training (1 session)", included: true },
      ],

      color: "from-teal-500 to-emerald-500",
      buttonText: "Contact Us",
    },
    {
      name: "Multi-Specialty Hospital",
      icon: HospitalIcon,
      price: "₹8,000",
      period: "/month",
      description:
        "Enterprise solution for hospitals with multiple departments",
      popular: false,
      features: [
        { name: "Unlimited patients", included: true },
        { name: "Multi-department management", included: true },
        { name: "Advanced EHR with integrations", included: true },
        { name: "Inter-department referrals", included: true },
        { name: "Integrated lab & pharmacy", included: true },
        { name: "Unlimited AI transcription", included: true },
        { name: "Advanced analytics & reporting", included: true },
        { name: "Custom workflows", included: true },
        { name: "Role-based access control", included: true },
        { name: "24/7 priority support", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "On-site training & onboarding", included: true },
      ],

      color: "from-emerald-500 to-cyan-500",
      buttonText: "Contact Sales",
    },
  ];

  const addOns = [
    {
      name: "Telemedicine Module",
      price: "₹299/month",
      description:
        "WhatsApp integration, video consultations, remote prescriptions",
    },
    {
      name: "Additional AI Transcription",
      price: "₹199/month",
      description: "Extra 500 minutes of AI-powered consultation recording",
    },
    {
      name: "Advanced Analytics",
      price: "₹499/month",
      description: "Detailed insights, custom reports, predictive analytics",
    },
    {
      name: "Insurance Integration",
      price: "₹799/month",
      description: "Direct integration with major Indian insurance providers",
    },
  ];

  const discounts = [
    {
      title: "Annual Subscription",
      discount: "20% OFF",
      description: "Save 2 months when you pay annually",
    },
    {
      title: "Educational Institutions",
      discount: "30% OFF",
      description:
        "Special pricing for medical colleges and teaching hospitals",
    },
    {
      title: "Multi-Location",
      discount: "15% OFF",
      description: "Discount for clinics with 3+ locations",
    },
  ];

  return (
    <section
      id="pricing"
      className="relative bg-gradient-to-b from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 py-20"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6 shadow-lg">
            <IndianRupeeIcon className="w-4 h-4" />
            Transparent Pricing in INR
          </div>
          <h2 className="text-5xl font-bold mb-6">
            Simple,{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Choose the plan that fits your practice. All plans include core
            features with no hidden costs. Start with a 14-day free trial—no
            credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative p-8 hover:shadow-2xl transition-all duration-300 ${
                plan.popular
                  ? "border-2 border-teal-500 dark:border-teal-400 scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              )}

              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}
              >
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {plan.description}
              </p>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-teal-600">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Billed monthly • Cancel anytime
                </p>
              </div>

              <Link to="/contact" className="w-full">
                <Button
                  className={`w-full mb-8 ${
                    plan.popular
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                      : "bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50"
                  }`}
                  size="lg"
                >
                  {plan.buttonText} <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckCircle2Icon className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XIcon className="w-5 h-5 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Enhance Your Plan with{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Add-ons
              </span>
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Customize your experience with optional modules that can be added
              to any plan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-teal-600" />

                  <h4 className="font-bold">{addon.name}</h4>
                </div>
                <div className="text-2xl font-bold text-teal-600 mb-3">
                  {addon.price}
                </div>
                <p className="text-sm text-muted-foreground">
                  {addon.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Discounts Section */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-3xl p-12 mb-16 border border-teal-100 dark:border-teal-900">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Special Discounts & Offers
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Save more with our special pricing programs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {discounts.map((discount, index) => (
              <Card key={index} className="p-8 text-center">
                <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-lg mb-4">
                  {discount.discount}
                </div>
                <h4 className="font-bold text-xl mb-2">{discount.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {discount.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-12 text-white text-center">
          <HospitalIcon className="w-16 h-16 mx-auto mb-6 opacity-90" />

          <h3 className="text-3xl font-bold mb-4">
            Enterprise & Custom Solutions
          </h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Need a custom solution for your large hospital or healthcare
            network? We offer tailored packages with dedicated support, custom
            integrations, and flexible pricing.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <CheckCircle2Icon className="w-5 h-5" />

              <span>Custom integrations</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <CheckCircle2Icon className="w-5 h-5" />

              <span>Dedicated account manager</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <CheckCircle2Icon className="w-5 h-5" />

              <span>On-premise deployment option</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <CheckCircle2Icon className="w-5 h-5" />

              <span>SLA guarantees</span>
            </div>
          </div>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-teal-600 hover:bg-gray-100"
          >
            Contact Sales Team <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* FAQ Preview */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Have questions about pricing?
          </p>
          <Button
            variant="outline"
            size="lg"
            className="border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            View Pricing FAQ <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
