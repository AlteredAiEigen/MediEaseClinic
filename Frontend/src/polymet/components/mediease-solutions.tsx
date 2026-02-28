import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { 
  BrainCircuitIcon, 
  ActivityIcon, 
  TrendingUpIcon,
  FileTextIcon,
  BarChart3Icon,
  UsersIcon,
  TargetIcon,
  ArrowRightIcon
} from "lucide-react"

interface Solution {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  sections: {
    title: string
    content: string
  }[]
}

const solutions: Solution[] = [
  {
    id: "intelligent-documentation",
    title: "Intelligent Documentation",
    subtitle: "AI-Powered Clinical Notes",
    icon: BrainCircuitIcon,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
    sections: [
      {
        title: "EHR-INTEGRATED DECISION SUPPORT",
        content: "Real-time voice transcription captures consultations in 100+ languages with 99% accuracy, automatically extracting symptoms, diagnoses, and medications into structured SOAP notes."
      },
      {
        title: "CLINICAL INTELLIGENCE ENGINE",
        content: "Advanced NLP algorithms provide evidence-based recommendations, drug interaction alerts, and treatment suggestions based on patient history and predictive analytics."
      },
      {
        title: "AUTOMATED WORKFLOW INTEGRATION",
        content: "Seamlessly integrates with existing EHR systems through HL7 FHIR APIs, reducing documentation time by 70% while maintaining full HIPAA compliance."
      }
    ]
  },
  {
    id: "operational-hub",
    title: "The Operational Hub",
    subtitle: "Patient Engagement Center",
    icon: ActivityIcon,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
    sections: [
      {
        title: "CENTRALIZED PATIENT MANAGEMENT",
        content: "Consolidates marketing data, EHR records, appointment scheduling, and referral activity into one actionable view with intelligent wait-time predictions."
      },
      {
        title: "DIGITAL PATIENT EXPERIENCE",
        content: "Unified patient portal enables self-service booking, digital check-in, and secure access to medical records with automated reminders through HIPAA-compliant channels."
      },
      {
        title: "ENGAGEMENT ANALYTICS",
        content: "Track patient interaction patterns, monitor no-show rates, and automate re-engagement campaigns to improve retention through personalized touchpoints."
      }
    ]
  },
  {
    id: "foundry-ai",
    title: "Foundry AI",
    subtitle: "Revenue Intelligence Platform",
    icon: TrendingUpIcon,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/20",
    sections: [
      {
        title: "REVENUE OPTIMIZATION ENGINE",
        content: "Advanced analytics identify coding opportunities, track billing efficiency, and monitor collection rates. AI-powered claim scrubbing reduces denials by 60%."
      },
      {
        title: "PERFORMANCE INTELLIGENCE",
        content: "Real-time KPIs for patient volume, provider productivity, and operational efficiency. Predictive models optimize scheduling and maximize practice profitability."
      },
      {
        title: "QUALITY & COMPLIANCE TRACKING",
        content: "Monitor clinical outcomes, track HEDIS measures, and generate automated reports for value-based care programs while ensuring CMS and MIPS compliance."
      }
    ]
  }
]

export function MedieaseSolutions() {
  const [activeSolution, setActiveSolution] = useState<string>(solutions[0].id)
  const currentSolution = solutions.find(s => s.id === activeSolution) || solutions[0]

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="mb-4">
          <span className="text-cyan-400 text-sm font-semibold">PLATFORM CAPABILITIES</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Platform Capabilities
        </h2>
        <p className="text-lg text-blue-200 max-w-3xl mx-auto">
          Platform Capabilities
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
        {/* Left Sidebar - Solutions Navigation */}
        <div className="space-y-4">
          {solutions.map((solution) => {
            const Icon = solution.icon
            const isActive = activeSolution === solution.id
            
            return (
              <button
                key={solution.id}
                onClick={() => setActiveSolution(solution.id)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? "bg-gradient-to-br from-blue-900/60 via-purple-900/50 to-blue-800/60 backdrop-blur-sm border border-white/20 shadow-xl" 
                    : "bg-transparent border border-transparent hover:bg-blue-900/20 hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isActive ? solution.iconBg : "bg-transparent"
                  }`}>
                    <Icon className={`w-7 h-7 transition-colors duration-300 ${
                      isActive ? solution.iconColor : "text-white/60 group-hover:text-white/80"
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/80 group-hover:text-white"
                    }`}>
                      {solution.title}
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      isActive ? "text-blue-200" : "text-white/60 group-hover:text-white/80"
                    }`}>
                      {solution.subtitle}
                    </p>
                  </div>

                  <ArrowRightIcon className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${
                    isActive ? "text-white opacity-100 translate-x-0" : "text-white/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  }`} />
                </div>
                
                {/* Subtle gradient overlay on hover */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right Content Panel */}
        <div className="space-y-8">
          {currentSolution.sections.map((section, index) => (
            <div key={index} className="space-y-3 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-white tracking-wide">
                {section.title}
              </h3>
              <p className="text-blue-200 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>


    </section>
  )
}