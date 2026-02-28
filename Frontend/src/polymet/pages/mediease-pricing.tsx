import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon, StethoscopeIcon, CalendarIcon, BarChartIcon, HospitalIcon, SparklesIcon, UsersIcon, ShieldCheckIcon, ZapIcon } from "lucide-react"
import { useDemoForm } from "@/polymet/layouts/mediease-layout"

export function MedieasePricing() {
  const { openDemoForm } = useDemoForm()

  const pricingPlans = [
    {
      name: "Pay-As-You-Go",
      description: "Perfect for solo practitioners",
      icon: StethoscopeIcon,
      features: [
        "Unlimited patients & appointments",
        "AI consultation recording",
        "WhatsApp/SMS notifications",
        "Basic analytics",
        "Email support"
      ],
      cta: "Book Demo",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Yearly",
      description: "Best value for growing clinics",
      icon: CalendarIcon,
      features: [
        "Everything in Pay-As-You-Go",
        "Advanced revenue analytics",
        "Priority support",
        "Multi-staff management",
        "Custom branding",
        "API access"
      ],
      cta: "Book Demo",
      ctaVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      description: "Custom solution for hospitals",
      icon: HospitalIcon,
      features: [
        "Everything in Yearly",
        "Custom integrations",
        "Dedicated account manager",
        "Multi-location support",
        "White-label option",
        "SLA guarantee",
        "Custom training"
      ],
      cta: "Contact Sales",
      ctaVariant: "default" as const,
      popular: false
    }
  ]

  const comparisonFeatures = [
    { name: "Appointments", payAsYouGo: true, yearly: true, enterprise: true },
    { name: "AI Patient Updates", payAsYouGo: true, yearly: true, enterprise: true },
    { name: "WhatsApp Integration", payAsYouGo: true, yearly: true, enterprise: true },
    { name: "SMS Notifications", payAsYouGo: true, yearly: true, enterprise: true },
    { name: "Revenue Analytics", payAsYouGo: "Basic", yearly: "Advanced", enterprise: "Custom" },
    { name: "Priority Support", payAsYouGo: false, yearly: true, enterprise: true },
    { name: "Multi-Staff Management", payAsYouGo: false, yearly: true, enterprise: true },
    { name: "Multi-Location", payAsYouGo: false, yearly: false, enterprise: true },
    { name: "Custom Integrations", payAsYouGo: false, yearly: false, enterprise: true },
    { name: "Dedicated Account Manager", payAsYouGo: false, yearly: false, enterprise: true },
    { name: "White-Label Option", payAsYouGo: false, yearly: false, enterprise: true },
    { name: "SLA Guarantee", payAsYouGo: false, yearly: false, enterprise: true }
  ]



  return (
    <div className="w-full" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)' }}>
      {/* Hero Section with Pricing Cards */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-6 mb-16">
              <Badge className="bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700">
                PRICING
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                Only pay for what you use
              </h1>
              
              <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                Transparent, usage-based pricing for calls and flexible enterprise plans. Scale up or down as you need.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => {
                const Icon = plan.icon
                return (
                  <Card
                    key={index}
                    className="relative overflow-hidden bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all duration-300"
                  >
                    <CardHeader className="space-y-4 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-sm text-slate-400">{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pb-6">
                      <div className="text-sm text-slate-500 font-medium">Perfect for {plan.name === "Pay-As-You-Go" ? "AdHoc use cases" : plan.name === "Yearly" ? "Small businesses with growing revenues" : "large organisations"}:</div>
                      <div className="space-y-2">
                        {plan.features.slice(0, 3).map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button
                        onClick={openDemoForm}
                        variant="outline"
                        className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        {plan.cta === "Contact Sales" ? "Talk to sales" : "Book Demo"}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-slate-800 text-cyan-400 border-slate-700 mb-4">
                <BarChartIcon className="w-3 h-3 mr-1" />
                Compare Plans
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Detailed Feature Comparison
              </h2>
              <p className="text-slate-400 mt-4 text-lg">
                See what's included in each plan
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800">
                    <th className="text-left py-4 px-4 font-semibold text-white">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-white">Pay-As-You-Go</th>
                    <th className="text-center py-4 px-4 font-semibold text-white">
                      Yearly
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-white">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-4 text-slate-300">{feature.name}</td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.payAsYouGo === "boolean" ? (
                          feature.payAsYouGo ? (
                            <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600">-</span>
                          )
                        ) : (
                          <span className="text-sm text-slate-400">{feature.payAsYouGo}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.yearly === "boolean" ? (
                          feature.yearly ? (
                            <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600">-</span>
                          )
                        ) : (
                          <span className="text-sm text-slate-400 font-medium">{feature.yearly}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.enterprise === "boolean" ? (
                          feature.enterprise ? (
                            <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600">-</span>
                          )
                        ) : (
                          <span className="text-sm text-slate-400 font-medium">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>



      {/* Final CTA Section */}
      <section className="py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">
                Not sure which plan fits?
              </h2>
              <p className="text-xl text-slate-400">
                Book a personalized demo and we'll help you choose the perfect solution for your clinic
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={openDemoForm}
                className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8"
              >
                <ZapIcon className="w-5 h-5 mr-2" />
                Book Demo
              </Button>
            </div>

            <div className="pt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-cyan-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-cyan-400" />
                Free 30-day trial
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-cyan-400" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}