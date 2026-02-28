import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { 
  UserPlusIcon, 
  StethoscopeIcon,
  MicIcon,
  SparklesIcon,
  FileTextIcon,
  BrainCircuitIcon,
  CheckCircleIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  ZapIcon,
  SmartphoneIcon,
  WifiIcon,
  GlobeIcon,
  BotIcon,
  MessageCircleIcon,
  BellIcon,
  AudioLinesIcon
} from "lucide-react"

// Calculate circular positions around center
const calculateCirclePosition = (index: number, total: number, radius: number) => {
  const angle = (index * 360) / total - 90 // Start from top
  const radian = (angle * Math.PI) / 180
  return {
    x: 50 + radius * Math.cos(radian),
    y: 50 + radius * Math.sin(radian)
  }
}

const workflowIcons = [
  {
    id: 1,
    icon: SmartphoneIcon,
    title: "Patient Check-In",
    description: "Digital registration and appointment confirmation",
    isAI: false
  },
  {
    id: 2,
    icon: StethoscopeIcon,
    title: "Doctor Consultation",
    description: "Healthcare provider conducts patient examination",
    isAI: false
  },
  {
    id: 3,
    icon: MicIcon,
    title: "Voice Recording",
    description: "Conversation captured in real-time",
    isAI: false
  },
  {
    id: 4,
    icon: AudioLinesIcon,
    title: "AI Transcription",
    description: "AI converts speech to text in 100+ languages with 99.9% accuracy",
    isAI: true
  },
  {
    id: 5,
    icon: BrainCircuitIcon,
    title: "AI Data Extraction",
    description: "AI intelligently extracts symptoms, diagnoses, medications, and medical insights",
    isAI: true
  },
  {
    id: 6,
    icon: FileTextIcon,
    title: "Structured Records",
    description: "Complete medical documentation generated automatically",
    isAI: false
  },
  {
    id: 7,
    icon: CheckCircleIcon,
    title: "Auto Check-Out",
    description: "Patient checkout with complete documentation ready",
    isAI: false
  },
  {
    id: 8,
    icon: MessageCircleIcon,
    title: "WhatsApp Updates",
    description: "Instant reports and updates sent to patients",
    isAI: false
  },
  {
    id: 9,
    icon: ShieldCheckIcon,
    title: "HIPAA Compliance",
    description: "Enterprise-grade security and data protection",
    isAI: false
  },
  {
    id: 10,
    icon: DatabaseIcon,
    title: "Cloud Storage",
    description: "Secure cloud-based medical records management",
    isAI: false
  }
]

const aiFeatures = [
  {
    icon: MicIcon,
    title: "Real-time Audio Capture",
    description: "Crystal-clear audio recording of every consultation",
    stat: "99.9%",
    statLabel: "Accuracy"
  },
  {
    icon: SparklesIcon,
    title: "Multilingual Transcription",
    description: "Instant speech-to-text in 100+ languages",
    stat: "100+",
    statLabel: "Languages"
  },
  {
    icon: BrainCircuitIcon,
    title: "Smart Data Extraction",
    description: "AI identifies symptoms, diagnoses, and medications",
    stat: "<2s",
    statLabel: "Processing"
  },
  {
    icon: DatabaseIcon,
    title: "Digital Records",
    description: "Structured, searchable medical documentation",
    stat: "100%",
    statLabel: "Digital"
  },
  {
    icon: ShieldCheckIcon,
    title: "HIPAA Compliant",
    description: "Enterprise-grade security and encryption",
    stat: "256-bit",
    statLabel: "Encryption"
  },
  {
    icon: RefreshCwIcon,
    title: "Auto-Sync Updates",
    description: "Real-time synchronization across all systems",
    stat: "Instant",
    statLabel: "Sync"
  }
]

export function MedieaseWorkflow() {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null)
  const [showCoreLabel, setShowCoreLabel] = useState(false)

  return (
    <section className="container mx-auto px-4">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="mb-6">
          <span className="text-cyan-400 text-sm font-semibold">
            <ZapIcon className="w-3 h-3 mr-2 inline" />
            INTELLIGENT WORKFLOW
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          From Check-In to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-orange-400">
            AI-Powered
          </span>{" "}
          Check-Out
        </h2>
        <p className="text-lg md:text-xl text-blue-200 max-w-4xl mx-auto leading-relaxed">
          Hover over each icon to discover how AI transforms every step of the patient journey
        </p>
      </div>

        {/* Interactive Workflow Visualization */}
        <div className="max-w-7xl mx-auto">
          <div className="relative h-[800px] overflow-visible">
            {/* Connection Lines - Radial from Center */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.6 }} />
                </linearGradient>
                <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>
              {/* Radial lines from center to each icon */}
              {workflowIcons.map((_, index) => {
                const pos = calculateCirclePosition(index, workflowIcons.length, 35)
                const isAI = workflowIcons[index].isAI
                return (
                  <line
                    key={index}
                    x1="50%"
                    y1="50%"
                    x2={`${pos.x}%`}
                    y2={`${pos.y}%`}
                    stroke={isAI ? "url(#aiGradient)" : "url(#flowGradient)"}
                    strokeWidth={isAI ? "3" : "2"}
                    strokeDasharray="8,4"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                )
              })}
              {/* Outer circle */}
              <circle
                cx="50%"
                cy="50%"
                r="35%"
                stroke="url(#flowGradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="12,8"
                className="animate-spin"
                style={{ animationDuration: '30s' }}
              />
            </svg>

            {/* Central AI Robot */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
              onClick={() => setShowCoreLabel(!showCoreLabel)}
            >
              <div className="relative">
                {/* Pulsing Glow Rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-orange-500/20 via-yellow-500/20 to-orange-500/20 blur-3xl animate-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center animate-ping" style={{ animationDuration: '3s' }}>
                  <div className="w-48 h-48 rounded-full border-2 border-orange-400/30" />
                </div>
                
                {/* AI Processing Core Label - ABOVE the circle - Only show when clicked */}
                {showCoreLabel && (
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-in fade-in zoom-in duration-300">
                    <div className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-600 text-white font-semibold text-sm shadow-xl border border-orange-300/40 backdrop-blur-sm animate-pulse">
                      <div className="flex items-center gap-2">
                        <BotIcon className="w-4 h-4" />
                        <span>AI Processing Core</span>
                        <SparklesIcon className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Robot Container */}
                <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center shadow-2xl border-4 border-orange-300/50 animate-pulse" style={{ animationDuration: '2s' }}>
                  {/* Robot Icon */}
                  <BotIcon className="w-20 h-20 text-white relative z-10" />
                  
                  {/* Inner Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 blur-2xl opacity-60" />
                  
                  {/* Rotating Circuit Ring */}
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/40 animate-spin" style={{ animationDuration: '8s' }} />
                  
                  {/* AI Sparkles */}
                  <div className="absolute -top-2 -right-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Workflow Icons */}
            {workflowIcons.map((item, index) => {
              const Icon = item.icon
              const isHovered = hoveredIcon === item.id
              const position = calculateCirclePosition(index, workflowIcons.length, 35)
              
              return (
                <div
                  key={item.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ top: `${position.y}%`, left: `${position.x}%` }}
                  onMouseEnter={() => setHoveredIcon(item.id)}
                  onMouseLeave={() => setHoveredIcon(null)}
                >
                  {/* Icon Circle */}
                  <div className={`relative transition-all duration-300 ${
                    isHovered ? 'scale-125' : 'scale-100'
                  }`}>
                    {/* Outer Glow Ring - AI items get orange glow */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                      isHovered 
                        ? item.isAI
                          ? 'w-32 h-32 -m-4 bg-gradient-to-br from-orange-500 to-yellow-500 blur-2xl opacity-70'
                          : 'w-32 h-32 -m-4 bg-gradient-to-br from-cyan-500 to-blue-500 blur-2xl opacity-70'
                        : item.isAI
                          ? 'w-24 h-24 bg-orange-500/30 blur-xl opacity-50'
                          : 'w-24 h-24 bg-blue-500/30 blur-xl opacity-50'
                    }`} />
                    
                    {/* Pulsing Ring on Hover */}
                    {isHovered && (
                      <div className={`absolute inset-0 w-28 h-28 -m-2 rounded-full border-2 animate-ping ${
                        item.isAI ? 'border-orange-400' : 'border-cyan-400'
                      }`} />
                    )}
                    
                    {/* AI Badge */}
                    {item.isAI && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-white/30 animate-pulse">
                          <SparklesIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Icon Container */}
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300">
                      {/* Inner Circuit Ring */}
                      <div className={`absolute inset-2 rounded-full border border-dashed transition-all duration-300 ${
                        item.isAI
                          ? isHovered ? 'border-orange-400/50 animate-spin' : 'border-orange-500/20'
                          : isHovered ? 'border-cyan-400/50 animate-spin' : 'border-blue-500/20'
                      }`} style={{ animationDuration: '4s' }} />
                      
                      <Icon className={`transition-all duration-300 relative z-10 ${
                        item.isAI
                          ? isHovered ? 'w-12 h-12 text-orange-400' : 'w-10 h-10 text-orange-300'
                          : isHovered ? 'w-12 h-12 text-cyan-400' : 'w-10 h-10 text-blue-300'
                      }`} />
                      
                      {/* Inner Glow */}
                      {isHovered && (
                        <div className={`absolute inset-0 rounded-full animate-pulse ${
                          item.isAI
                            ? 'bg-gradient-to-br from-orange-400/30 to-yellow-400/30'
                            : 'bg-gradient-to-br from-cyan-400/30 to-blue-400/30'
                        }`} />
                      )}
                    </div>
                    
                    {/* Tooltip - Compact & Elegant Design */}
                    {isHovered && (
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-56 z-[100] animate-in fade-in zoom-in duration-200 ${
                        position.y < 50 ? 'top-full mt-3' : 'bottom-full mb-3'
                      }`}>
                        {/* Tooltip Arrow */}
                        <div className={`absolute left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 rotate-45 z-[101] ${
                          position.y < 50 
                            ? '-top-1 ' + (item.isAI ? 'bg-orange-600' : 'bg-blue-600')
                            : '-bottom-1 ' + (item.isAI ? 'bg-orange-600' : 'bg-blue-600')
                        }`} />
                        
                        {/* Tooltip Card */}
                        <div className={`relative rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl border z-[102] ${
                          item.isAI 
                            ? 'bg-gradient-to-br from-orange-600 via-yellow-600 to-orange-700 border-orange-400/70' 
                            : 'bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 border-cyan-400/70'
                        }`}>
                          {/* Icon & Title Row */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${
                              item.isAI 
                                ? 'bg-white/25' 
                                : 'bg-white/25'
                            }`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-white font-bold text-xs flex-1 leading-tight">{item.title}</h4>
                          </div>
                          
                          {/* Description */}
                          <p className="text-[11px] leading-relaxed text-white/95 pl-10">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>


    </section>
  )
}