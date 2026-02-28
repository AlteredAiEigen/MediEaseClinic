import { Badge } from "@/components/ui/badge"
import { 
  MicIcon, 
  SparklesIcon, 
  BrainCircuitIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  RefreshCwIcon
} from "lucide-react"

const techFeatures = [
  {
    icon: MicIcon,
    title: "Real-time Audio Capture",
    description: "Crystal-clear audio recording of every consultation"
  },
  {
    icon: SparklesIcon,
    title: "Multilingual Transcription",
    description: "Instant speech-to-text in 100+ languages"
  },
  {
    icon: BrainCircuitIcon,
    title: "Smart Data Extraction",
    description: "AI identifies symptoms, diagnoses, and medications"
  },
  {
    icon: DatabaseIcon,
    title: "Digital Records",
    description: "Structured, searchable medical documentation"
  },
  {
    icon: ShieldCheckIcon,
    title: "HIPAA Compliant",
    description: "Enterprise-grade security and encryption"
  },
  {
    icon: RefreshCwIcon,
    title: "Auto-Sync Updates",
    description: "Real-time synchronization across all systems"
  }
]

export function MedieaseTechnologyCta() {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-16">
            <div className="flex-1 max-w-2xl">
              <Badge 
                variant="outline" 
                className="mb-4 border-cyan-500/40 bg-cyan-500/10 text-cyan-300 px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              >
                POWERED BY ADVANCED AI
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                The Technology Behind<br />the Magic
              </h2>
            </div>
            <div className="flex-1 max-w-xl">
              <p className="text-lg text-blue-200/80 leading-relaxed pt-8">
                Enterprise-grade AI algorithms working in real-time to deliver accurate, structured medical documentation
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-blue-700/40 overflow-hidden rounded-lg">
          {techFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={index}
                className="group relative bg-blue-900/30 backdrop-blur-sm p-10 border-r border-b border-blue-700/40 last:border-r-0 hover:bg-blue-800/40 transition-all duration-300"
                style={{
                  borderRight: (index + 1) % 3 === 0 ? 'none' : undefined,
                  borderBottom: index >= 3 ? 'none' : undefined
                }}
              >
                {/* Icon */}
                <div className="mb-8">
                  <Icon className="w-12 h-12 text-cyan-400" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-blue-200/70 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
