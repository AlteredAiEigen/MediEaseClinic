import {
  BuildingIcon,
  HospitalIcon,
  Building2Icon,
  CheckCircle2Icon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  SparklesIcon,
} from "lucide-react";

export function PricingMegaMenu() {
  const pricingPlans = [
    {
      icon: BuildingIcon,
      name: "Clinic Plan",
      description: "Perfect for small to medium clinics with 1-5 doctors",
      features: [
        "Up to 5 doctors",
        "Unlimited patients",
        "AI transcription",
        "E-prescriptions",
        "Queue management",
        "Basic analytics",
        "Email support",
      ],

      popular: false,
      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: HospitalIcon,
      name: "Hospital Plan",
      description: "Comprehensive solution for multi-specialty hospitals",
      features: [
        "Unlimited doctors",
        "Unlimited patients",
        "Advanced AI features",
        "Department management",
        "Advanced analytics",
        "Custom integrations",
        "Priority support",
        "Dedicated account manager",
      ],

      popular: true,
      color: "from-emerald-500 to-cyan-500",
    },
    {
      icon: Building2Icon,
      name: "Enterprise Plan",
      description: "Custom solution for large healthcare organizations",
      features: [
        "Multi-location support",
        "Custom workflows",
        "API access",
        "White-label options",
        "Advanced security",
        "SLA guarantees",
        "24/7 phone support",
        "On-site training",
      ],

      popular: false,
      color: "from-cyan-500 to-blue-500",
    },
  ];

  const addOns = [
    {
      name: "Telemedicine Module",
      description: "WhatsApp integration and video consultations",
    },
    {
      name: "Insurance Integration",
      description: "Direct integration with insurance providers",
    },
    {
      name: "Advanced Analytics",
      description: "Custom reports and business intelligence",
    },
    {
      name: "Mobile Apps",
      description: "Native iOS and Android applications",
    },
  ];

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: "Call Us",
      description: "+91 (800) 123-4567",
      action: "Call Now",
      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: MailIcon,
      title: "Email Us",
      description: "sales@mediease.in",
      action: "Send Email",
      color: "from-emerald-500 to-cyan-500",
    },
    {
      icon: MessageSquareIcon,
      title: "Live Chat",
      description: "Available 9 AM - 6 PM IST",
      action: "Start Chat",
      color: "from-cyan-500 to-blue-500",
    },
  ];

  return (
    <div className="absolute top-full left-0 w-screen bg-white dark:bg-slate-900 shadow-2xl border-t border-border mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pricing Plans */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Flexible Pricing Plans
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose the perfect plan for your healthcare practice
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`group/item p-5 rounded-xl transition-all duration-300 cursor-pointer border-2 ${
                    plan.popular
                      ? "border-teal-500 dark:border-teal-600 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20"
                      : "border-transparent hover:border-teal-100 dark:hover:border-teal-900 hover:bg-gradient-to-br hover:from-teal-50/30 hover:to-emerald-50/30 dark:hover:from-teal-950/10 dark:hover:to-emerald-950/10"
                  }`}
                >
                  {plan.popular && (
                    <div className="flex items-center gap-1 mb-3">
                      <SparklesIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />

                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg group-hover/item:scale-110 transition-transform duration-300`}
                  >
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <div className="text-3xl font-bold mb-1">Contact Us</div>
                    <p className="text-xs text-muted-foreground">
                      For pricing details
                    </p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2Icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />

                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
                      plan.popular
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:shadow-lg"
                        : "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50"
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>

            {/* Add-ons */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-900">
              <h3 className="font-bold text-lg mb-4">Available Add-ons</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {addOns.map((addon, index) => (
                  <div
                    key={index}
                    className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-semibold text-sm mb-1">{addon.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {addon.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-teal-100 dark:border-teal-900">
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">Get in Touch</h3>
              <p className="text-sm text-muted-foreground">
                Contact us for detailed pricing and custom solutions
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group/contact"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center flex-shrink-0 group-hover/contact:scale-110 transition-transform`}
                    >
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">
                        {method.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {method.description}
                      </p>
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                        {method.action} →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-5 text-white mb-6">
              <h4 className="font-bold mb-2">Free Trial Available</h4>
              <p className="text-sm opacity-90 mb-3">
                Try MediEase free for 30 days. No credit card required.
              </p>
              <button className="w-full py-2 bg-white text-teal-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />

                <span className="text-muted-foreground">
                  No setup fees or hidden charges
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />

                <span className="text-muted-foreground">
                  Cancel anytime, no questions asked
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />

                <span className="text-muted-foreground">
                  Dedicated onboarding support
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1">
                Need a custom solution for your organization?
              </p>
              <p className="text-xs text-muted-foreground">
                Our team will work with you to create the perfect plan
              </p>
            </div>
            <a
              href="#pricing"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Request Quote →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
