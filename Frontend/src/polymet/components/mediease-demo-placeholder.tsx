import { Button } from "@/components/ui/button"
import { PlayIcon, VideoIcon, CheckCircleIcon, BotIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"

export function MedieaseDemoPlaceholder() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className="w-full px-6 md:px-8 lg:px-12">
      {/* Overlay Container */}
      <div className="max-w-[95%] mx-auto relative">
        {/* Main Overlay Box */}
        <div className="bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-blue-800/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Platform Demo</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Experience the Future of <span className="text-cyan-400">Healthcare</span>
              </h2>
              
              <p className="text-base md:text-lg text-blue-100 leading-relaxed">
                See how Mediease transforms patient care with intelligent voice assistants, 
                multilingual support, and seamless clinic management—all in one platform.
              </p>

              {/* Key Points */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100">AI-powered voice transcription in 10+ languages</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100">Automated patient check-in and profile updates</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100">Real-time clinic workflow management</p>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
                >
                  <VideoIcon className="w-5 h-5 mr-2" />
                  Request Live Demo
                </Button>
              </div>
            </div>

            {/* Right Visual/Demo Area */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-950/60 to-purple-950/60 rounded-2xl border border-white/5 relative overflow-hidden group">
                {/* Video Element */}
                <video 
                  className="w-full h-full object-cover rounded-2xl"
                  poster="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop&q=80"
                  controls={isPlaying}
                  onClick={() => setIsPlaying(true)}
                >
                  {/* Placeholder video - Big Buck Bunny (open source demo video) */}
                  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Play Button Overlay - Shows when not playing */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950/80 to-purple-950/80 backdrop-blur-sm cursor-pointer transition-all group-hover:from-blue-950/70 group-hover:to-purple-950/70"
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="text-center space-y-4">
                      {/* Large Play Button */}
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                        <PlayIcon className="w-10 h-10 text-white ml-1" fill="white" />
                      </div>
                      
                      {/* Text */}
                      <div>
                        <p className="text-white font-semibold text-lg">Watch Platform Demo</p>
                        <p className="text-blue-200 text-sm">See Mediease in action</p>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 w-16 h-16 border border-cyan-400/20 rounded-full" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border border-purple-400/20 rounded-full" />
                  </div>
                )}

                {/* Decorative Grid Pattern - Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                  }} />
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 shadow-xl hidden lg:block">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10+</div>
                  <div className="text-xs text-blue-100">Languages</div>
                </div>
              </div>
              
              <div className="absolute -top-6 -left-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-4 shadow-xl hidden lg:block">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">AI</div>
                  <div className="text-xs text-blue-100">Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  )
}