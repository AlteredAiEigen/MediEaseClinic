import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  HeartPulseIcon, 
  UsersIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  TargetIcon,
  TrendingUpIcon,
  GlobeIcon,
  AwardIcon
} from "lucide-react"

export function MedieaseAbout() {
  const values = [
    {
      icon: HeartPulseIcon,
      title: "Patient-Centered Care",
      description: "Every decision we make prioritizes patient experience and outcomes, ensuring healthcare is accessible and compassionate."
    },
    {
      icon: SparklesIcon,
      title: "Innovation First",
      description: "We leverage cutting-edge AI technology to solve real healthcare challenges and continuously push boundaries."
    },
    {
      icon: ShieldCheckIcon,
      title: "Trust & Security",
      description: "HIPAA compliance and data security are non-negotiable. We protect patient information with enterprise-grade security."
    },
    {
      icon: GlobeIcon,
      title: "Inclusive Healthcare",
      description: "Breaking language barriers with 10+ language support, making healthcare accessible to diverse communities."
    }
  ]



  const teamMembers = [
    {
      name: "Team Member 1",
      role: "Co-Founder & CEO",
      image: "https://github.com/yusufhilmi.png",
      bio: "Passionate about transforming healthcare through AI innovation."
    },
    {
      name: "Team Member 2",
      role: "Co-Founder & CTO",
      image: "https://github.com/kdrnp.png",
      bio: "Building scalable healthcare solutions with cutting-edge technology."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-800">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              About Mediease
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Revolutionizing Healthcare with
              <span className="block mt-2 bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
                AI-Powered Intelligence
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              We're on a mission to make healthcare more accessible, efficient, and patient-friendly 
              through intelligent automation and multilingual support.
            </p>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 fill-background" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </section>



      {/* Our Story Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                Our Story
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Building the Future of Healthcare
              </h2>
            </div>

            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Mediease was born from a simple observation: healthcare facilities struggle with language barriers, 
                inefficient check-in processes, and overwhelming administrative tasks that take time away from patient care.
              </p>
              <p>
                We envisioned a world where AI could bridge these gaps—where patients could communicate in their 
                native language, check-ins would be seamless, and healthcare providers could focus on what matters 
                most: delivering exceptional care.
              </p>
              <p>
                Today, Mediease combines intelligent voice assistants, multilingual support, and automated workflows 
                to transform how healthcare facilities operate. Our platform reduces check-in times by 85%, saves 
                healthcare providers 60% of their administrative time, and supports over 10 languages with 99% accuracy.
              </p>
              <p className="text-foreground font-medium">
                We're not just building software—we're creating a more inclusive, efficient, and compassionate 
                healthcare experience for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 dark:to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-600 dark:bg-purple-500">
                  <TargetIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To empower healthcare providers with AI-driven tools that eliminate language barriers, 
                streamline operations, and enhance patient experiences—making quality healthcare accessible 
                to everyone, regardless of language or background.
              </p>
            </Card>

            <Card className="p-8 border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 to-transparent dark:from-cyan-950/20 dark:to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-cyan-600 dark:bg-cyan-500">
                  <TrendingUpIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To become the global standard for AI-powered healthcare communication, where every patient 
                receives personalized care in their preferred language, and every healthcare provider has 
                more time to focus on healing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              Core Values
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              What Drives Us Forward
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our values guide every decision we make and every line of code we write
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const ValueIcon = value.icon
              return (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow border-border bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 dark:from-purple-500 dark:to-cyan-500 shrink-0">
                    <ValueIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              Our Team
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Meet the Founders
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A passionate team dedicated to transforming healthcare through innovation
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-all duration-300 border-border bg-card">
                <h3 className="text-2xl font-bold text-foreground mb-2">{member.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    {member.role}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}