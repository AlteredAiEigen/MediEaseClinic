import { Badge } from "@/components/ui/badge"

const languages = [
  { name: "Hindi", native: "हिंदी", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300" },
  { name: "English", native: "English", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { name: "Bengali", native: "বাংলা", color: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" },
  { name: "Telugu", native: "తెలుగు", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300" },
  { name: "Marathi", native: "मराठी", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { name: "Tamil", native: "தமிழ்", color: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" },
  { name: "Gujarati", native: "ગુજરાતી", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300" },
  { name: "Kannada", native: "ಕನ್ನಡ", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { name: "Malayalam", native: "മലയാളം", color: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300" },
]

export function MedieaseLanguages() {
  return (
    <section className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Content */}
        <div>
          <div className="mb-4">
            <span className="text-cyan-300 text-sm font-semibold">MULTILINGUAL SUPPORT</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Speak Your Language
          </h2>
          <p className="text-lg text-blue-100 mb-8 leading-relaxed">
            Break language barriers with support for 10+ Indian languages, ensuring 
            seamless communication with every patient.
          </p>

          {/* Language Tags */}
          <div className="flex flex-wrap gap-3">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="px-4 py-2"
              >
                <span className="text-sm font-medium text-cyan-300">{lang.native}</span>
                <span className="text-xs text-blue-300 ml-2">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Visual - Animated Circles */}
        <div className="relative h-[500px] flex items-center justify-center">
          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <div className="text-3xl font-bold">10+</div>
                <div className="text-sm font-medium">Languages</div>
              </div>
            </div>
          </div>

          {/* Orbiting Language Circles */}
          <div className="absolute inset-0 animate-spin-slow">
            {languages.map((lang, index) => {
              const angle = (index * 360) / languages.length
              const radius = 180
              const x = Math.cos((angle * Math.PI) / 180) * radius
              const y = Math.sin((angle * Math.PI) / 180) * radius

              return (
                <div
                  key={lang.name}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-blue-800/60 flex items-center justify-center animate-spin-reverse">
                    <span className="text-sm font-semibold text-cyan-300">{lang.native}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full border-2 border-dashed border-blue-500/20 opacity-30" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full border border-blue-500/20 opacity-20" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 30s linear infinite;
        }
      `}</style>
    </section>
  )
}