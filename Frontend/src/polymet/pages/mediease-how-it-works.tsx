import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { 
  LayoutDashboardIcon, 
  CalendarIcon, 
  StethoscopeIcon,
  CheckCircleIcon,
  UsersIcon,
  ClipboardListIcon,
  MicIcon,
  SparklesIcon,
  TrendingUpIcon,
  BellIcon,
  ArrowRightIcon,
  PlayIcon
} from "lucide-react"
import { useDemoForm } from "@/polymet/layouts/mediease-layout"

const roles = [
  {
    id: "admin",
    title: "Admin Dashboard",
    subtitle: "Full Clinic Oversight",
    icon: LayoutDashboardIcon,
    color: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    iconBg: "bg-cyan-500",
    screenshot: "https://assets.polymet.ai/experienced-cyan-461650",
    features: [
      {
        icon: CalendarIcon,
        title: "View All Appointments",
        description: "Complete visibility of all scheduled appointments across the clinic"
      },
      {
        icon: UsersIcon,
        title: "Staff Management",
        description: "Manage doctors, receptionists, and their schedules efficiently"
      },
      {
        icon: TrendingUpIcon,
        title: "Revenue Analytics",
        description: "Track appointment revenue, lab tests, and financial performance"
      },
      {
        icon: ClipboardListIcon,
        title: "Patient Reports",
        description: "Access comprehensive patient data and generate detailed reports"
      }
    ]
  },
  {
    id: "receptionist",
    title: "Receptionist Workflow",
    subtitle: "Effortless Patient Management",
    icon: CalendarIcon,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-500",
    screenshot: "https://assets.polymet.ai/integrated-orange-860096",
    features: [
      {
        icon: UsersIcon,
        title: "Register Patients",
        description: "Quick patient registration with complete profile management"
      },
      {
        icon: CalendarIcon,
        title: "Book Appointments",
        description: "Schedule appointments with automatic conflict detection"
      },
      {
        icon: CheckCircleIcon,
        title: "Check-in to Queue",
        description: "Check patients in and automatically notify assigned doctors"
      },
      {
        icon: BellIcon,
        title: "Conflict Detection",
        description: "Smart system prevents double-booking and scheduling conflicts"
      }
    ]
  },
  {
    id: "doctor",
    title: "Doctor Workstation",
    subtitle: "Focus on Patient Care",
    icon: StethoscopeIcon,
    color: "from-teal-500 to-green-500",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    iconBg: "bg-teal-500",
    screenshot: "https://assets.polymet.ai/unaware-azure-474612",
    features: [
      {
        icon: CalendarIcon,
        title: "Today's Appointments",
        description: "View upcoming appointments and patient queue in real-time"
      },
      {
        icon: LayoutDashboardIcon,
        title: "Full Calendar View",
        description: "Comprehensive calendar with all scheduled consultations"
      },
      {
        icon: MicIcon,
        title: "Consultation Workstation",
        description: "Start consultations with AI-powered conversation recording"
      },
      {
        icon: SparklesIcon,
        title: "Auto Profile Updates",
        description: "AI automatically updates patient profiles from conversations"
      }
    ]
  }
]

export function MedieaseHowItWorks() {
  const { openDemoForm } = useDemoForm()
  const [activeRole, setActiveRole] = useState(0)

  // Auto-rotate through roles every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRole((prev) => (prev + 1) % roles.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)' }}>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <Badge variant="outline" className="mb-6 text-cyan-300 border-cyan-300/50 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium">
              HOW IT WORKS
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Streamlined Workflows for{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Every Role</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-3xl mx-auto">
              From admin oversight to patient care, MediEase empowers your entire team with intelligent automation and seamless coordination
            </p>
            
            {/* Key Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-cyan-300 mb-1">3x</div>
                <div className="text-sm text-white/70">Faster Patient Processing</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-cyan-300 mb-1">10+</div>
                <div className="text-sm text-white/70">Languages Supported</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-cyan-300 mb-1">100%</div>
                <div className="text-sm text-white/70">HIPAA Compliant</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={openDemoForm}
                className="bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-xl"
              >
                Book a Demo
                <ArrowRightIcon className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={openDemoForm}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
              >
                <PlayIcon className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Role Showcase - VectorShift Style */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for <span className="text-cyan-300">Every Role</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Tailored experiences that empower your entire healthcare team with role-specific dashboards and workflows
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {roles.map((role, index) => {
              const Icon = role.icon
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(index)}
                  className={`group px-6 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                    activeRole === index
                      ? 'bg-white text-blue-900 shadow-xl scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    activeRole === index ? 'text-blue-900' : 'text-cyan-300'
                  }`} />
                  {role.title}
                </button>
              )
            })}
          </div>

          {/* Active Role Content with Animation */}
          <div className="relative">
            {roles.map((role, index) => {
              const Icon = role.icon
              return (
                <div
                  key={role.id}
                  className={`transition-all duration-500 ${
                    activeRole === index
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 absolute inset-0 pointer-events-none translate-y-8'
                  }`}
                >
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content Side */}
                    <div className="space-y-8">
                      <div>
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} mb-5 shadow-2xl`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          {role.subtitle}
                        </h3>
                        <p className="text-base text-cyan-300 mb-6">
                          {role.title}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {index === 0 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Analytics</span>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Staff Management</span>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Revenue Tracking</span>
                            </>
                          )}
                          {index === 1 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Scheduling</span>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Patient Check-in</span>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Queue Management</span>
                            </>
                          )}
                          {index === 2 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">AI Transcription</span>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Patient Records</span>
                              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/20">Smart Updates</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-4">
                        {role.features.map((feature, idx) => {
                          const FeatureIcon = feature.icon
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                <FeatureIcon className="w-5 h-5 text-cyan-300" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold mb-1">
                                  {feature.title}
                                </h4>
                                <p className="text-sm text-white/60">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Screenshot Side with Animation */}
                    <div className="relative">
                      {/* Animated glow */}
                      <div className={`absolute -inset-8 bg-gradient-to-br ${role.color} opacity-30 blur-3xl animate-pulse`} />
                      
                      {/* Screenshot container */}
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm">
                        <img
                          src={role.screenshot}
                          alt={`${role.title} interface`}
                          className="w-full h-auto transform transition-transform duration-700 hover:scale-105"
                        />
                      </div>

                      {/* Floating indicator */}
                      <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Active Role</div>
                          <div className="text-sm font-bold text-gray-900">{role.title}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Workflow Process Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete Patient <span className="text-cyan-300">Journey</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              From check-in to checkout, every step is optimized for efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Patient Arrival",
                description: "Receptionist checks in patient and adds to queue",
                icon: UsersIcon,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "Doctor Notification",
                description: "Doctor receives instant notification of patient in queue",
                icon: BellIcon,
                color: "from-cyan-500 to-teal-500"
              },
              {
                step: "03",
                title: "AI Consultation",
                description: "Doctor conducts consultation with AI transcription",
                icon: MicIcon,
                color: "from-teal-500 to-green-500"
              },
              {
                step: "04",
                title: "Auto Updates",
                description: "Patient profile automatically updated from conversation",
                icon: SparklesIcon,
                color: "from-green-500 to-emerald-500"
              }
            ].map((item, idx) => {
              const ItemIcon = item.icon
              return (
                <div key={idx} className="relative">
                  {/* Connector Line */}
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/30 to-transparent" />
                  )}
                  
                  <div className="relative p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <ItemIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs font-bold text-cyan-300 mb-2">{item.step}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* High ROI Section - Zigzag Layout */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              High ROI <span className="text-cyan-300">Use Cases</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-2">
              Real results from healthcare providers using MediEase
            </p>
            <p className="text-sm text-white/50 max-w-xl mx-auto">
              Proven metrics from clinics of all sizes - from single practitioners to multi-location healthcare networks
            </p>
          </div>

          {/* Zigzag/Alternating Stats Layout */}
          <div className="space-y-12 max-w-6xl mx-auto">
            {[
              {
                metric: "85%",
                label: "Faster Check-ins",
                description: "Patients checked in and queued automatically with zero manual data entry. Receptionists can process 3x more patients in the same time.",
                icon: CheckCircleIcon,
                color: "from-green-500 to-emerald-500",
                align: "left"
              },
              {
                metric: "60%",
                label: "Time Saved",
                description: "Reduced administrative workload for staff through intelligent automation. Doctors spend more time with patients, less on paperwork.",
                icon: TrendingUpIcon,
                color: "from-blue-500 to-cyan-500",
                align: "right"
              },
              {
                metric: "10+",
                label: "Languages",
                description: "Multilingual support for diverse patients breaks down communication barriers. Serve international patients without language constraints.",
                icon: SparklesIcon,
                color: "from-purple-500 to-pink-500",
                align: "left"
              },
              {
                metric: "100%",
                label: "AI Accuracy",
                description: "Automated patient profile updates from AI transcription ensure complete and accurate medical records with zero manual entry errors.",
                icon: MicIcon,
                color: "from-orange-500 to-red-500",
                align: "right"
              }
            ].map((stat, idx) => {
              const StatIcon = stat.icon
              return (
                <div
                  key={idx}
                  className={`flex flex-col md:flex-row items-center gap-8 ${stat.align === 'right' ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Metric Card */}
                  <div className="flex-shrink-0 w-full md:w-80">
                    <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 group hover:scale-105">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl`}>
                        <StatIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-6xl font-bold text-white mb-3">
                        {stat.metric}
                      </div>
                      <div className="text-2xl font-semibold text-cyan-300">
                        {stat.label}
                      </div>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="flex-1">
                    <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                      <p className="text-white/80 text-lg leading-relaxed">
                        {stat.description}
                      </p>
                      
                      {/* Mini stats */}
                      <div className="mt-6 flex flex-wrap gap-4">
                        {idx === 0 && (
                          <>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Avg. Check-in Time</div>
                              <div className="text-sm font-bold text-white">2 minutes</div>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Daily Capacity</div>
                              <div className="text-sm font-bold text-white">+45 patients</div>
                            </div>
                          </>
                        )}
                        {idx === 1 && (
                          <>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Hours Saved/Week</div>
                              <div className="text-sm font-bold text-white">15+ hours</div>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Staff Efficiency</div>
                              <div className="text-sm font-bold text-white">+60%</div>
                            </div>
                          </>
                        )}
                        {idx === 2 && (
                          <>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Supported Languages</div>
                              <div className="text-sm font-bold text-white">10+</div>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Translation Accuracy</div>
                              <div className="text-sm font-bold text-white">99%</div>
                            </div>
                          </>
                        )}
                        {idx === 3 && (
                          <>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Auto-Updates/Day</div>
                              <div className="text-sm font-bold text-white">50+</div>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                              <div className="text-xs text-white/60">Error Reduction</div>
                              <div className="text-sm font-bold text-white">100%</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integration & Security Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Security Features */}
            <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Enterprise-Grade Security
              </h3>
              <p className="text-white/70 mb-6">
                Your patient data is protected with industry-leading security standards
              </p>
              <div className="space-y-3">
                {[
                  "HIPAA Compliant Infrastructure",
                  "End-to-End Encryption",
                  "Regular Security Audits",
                  "Role-Based Access Control",
                  "Automated Backup & Recovery"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Features */}
            <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                <LayoutDashboardIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Seamless Integration
              </h3>
              <p className="text-white/70 mb-6">
                Works with your existing healthcare systems and workflows
              </p>
              <div className="space-y-3">
                {[
                  "Electronic Health Records (EHR)",
                  "Practice Management Systems",
                  "Laboratory Information Systems",
                  "Pharmacy Management Software",
                  "Billing & Insurance Platforms"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-cyan-400" />
                    </div>
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 p-12 md:p-20">
            {/* Animated background orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
            
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm mb-8 border border-white/30">
                <SparklesIcon className="w-5 h-5 text-cyan-300" />
                <span className="text-sm font-semibold text-white">AI-Powered Healthcare Platform</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Ready to Transform Your Clinic?
              </h3>
              <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join hundreds of healthcare providers using MediEase to streamline operations, reduce administrative burden, and improve patient care quality.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-8 mb-10 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-cyan-300" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-cyan-300" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-cyan-300" />
                  <span>Cancel anytime</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Button 
                  size="lg" 
                  onClick={openDemoForm}
                  className="bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-10 py-7 text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all"
                >
                  Book a Demo
                  <ArrowRightIcon className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={openDemoForm}
                  className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 font-semibold px-10 py-7 text-lg rounded-2xl backdrop-blur-sm hover:scale-105 transition-all"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}