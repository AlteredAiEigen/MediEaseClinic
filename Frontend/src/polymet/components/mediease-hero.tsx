import { Button } from "@/components/ui/button"
import { PlayIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MedieaseHeroProps {
  onBookDemo?: () => void
}

export function MedieaseHero({ onBookDemo }: MedieaseHeroProps = {}) {
  const [showVideoDialog, setShowVideoDialog] = useState(false)

  return (
    <>
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Sun ray effect from left corner */}
          <div className="absolute -top-20 -left-20 w-[800px] h-[800px] bg-gradient-to-br from-purple-400/30 via-purple-500/15 to-transparent rounded-full blur-3xl" />
          
          {/* Secondary ray for depth */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/20 via-purple-400/10 to-transparent rounded-full blur-2xl" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }} />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Center-left aligned content */}
          <div className="max-w-4xl mx-auto lg:mx-0 lg:ml-[10%]">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Transform Healthcare with
              <br />
              <span className="text-cyan-200">AI-Powered</span> Medical Assistance
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-white/90 max-w-2xl mb-8 leading-relaxed">
              Mediease revolutionizes patient care with intelligent voice assistants, 
              multilingual support, and seamless clinic management—all in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
              <Button 
                size="lg" 
                onClick={onBookDemo}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-xl hover:shadow-2xl transition-all"
              >
                Book a Demo
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowVideoDialog(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold px-8 py-6 text-base rounded-xl backdrop-blur-sm"
              >
                <PlayIcon className="w-4 h-4 mr-2 fill-white" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators with logos */}
            <div className="flex flex-wrap items-center gap-6">
              {/* HIPAA Compliant Badge */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center relative">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-1.5 py-0.5">
                      <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-white">HIPAA Compliant</span>
              </div>

              {/* NHA Authority Badge */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg p-1.5">
                  <div className="text-center">
                    <div className="text-[7px] font-bold text-gray-800 leading-tight">NATIONAL</div>
                    <div className="text-[7px] font-bold text-gray-800 leading-tight">HEALTH</div>
                    <div className="text-[7px] font-bold text-gray-800 leading-tight">AUTHORITY</div>
                    <div className="text-[5px] text-gray-600 mt-0.5">भारत सरकार</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-white">NHA Recognized</span>
              </div>

              {/* Additional Trust Indicators */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">10+</div>
                    <div className="text-[10px] text-white/90">Languages</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-white">Multilingual</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Mediease Platform Demo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PlayIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Demo video will be embedded here</p>
              <p className="text-sm text-muted-foreground mt-2">YouTube or Vimeo embed</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}