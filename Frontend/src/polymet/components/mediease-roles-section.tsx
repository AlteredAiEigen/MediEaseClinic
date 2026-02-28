import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { 
  SettingsIcon, 
  ActivityIcon, 
  UserIcon,
  ArrowRightIcon
} from "lucide-react"

export function MedieaseRolesSection() {
  const roles = [
    {
      id: "clinic-admin",
      badge: "Clinic Administrator",
      icon: SettingsIcon,
      subtitle: "Infrastructure for Procedure & Therapy Adoption.",
      title: "Manage staff, monitor operations, and access comprehensive analytics",
      features: [
        "Staff Management",
        "Revenue Analytics",
        "Appointment Overview",
        "Compliance Reports"
      ],
      buttonText: "Explore Admin View",
      buttonColor: "bg-teal-500 hover:bg-teal-600",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      image: "https://v3b.fal.media/files/b/0a8f3a79/-WwaBemve8EJ64_lMA8s3.jpg"
    },
    {
      id: "healthcare-provider",
      badge: "Healthcare Provider",
      icon: ActivityIcon,
      subtitle: "Clinical Intelligence & Workflow Efficiency.",
      title: "Focus on patient care with AI-assisted documentation and instant EHR access",
      features: [
        "Patient Dashboard",
        "AI Transcription",
        "Quick Notes",
        "Treatment History"
      ],
      buttonText: "Explore Doctor View",
      buttonColor: "bg-emerald-500 hover:bg-emerald-600",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      image: "https://v3b.fal.media/files/b/0a8f3a79/L2e_lTCY9P0WtaTaFvHlG.jpg"
    },
    {
      id: "front-desk",
      badge: "Front Desk",
      icon: UserIcon,
      subtitle: "Patient Experience & Operations Management.",
      title: "Streamline patient intake, scheduling, and check-in processes",
      features: [
        "Appointment Booking",
        "Patient Check-in",
        "Queue Management",
        "Insurance Verification"
      ],
      buttonText: "Explore Receptionist View",
      buttonColor: "bg-cyan-500 hover:bg-cyan-600",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      image: "https://v3b.fal.media/files/b/0a8f3a79/Io7Y2lrYXWExcPBG2yBuy.jpg"
    }
  ]

  return (
    <section className="container mx-auto px-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Built for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
            Every Role
          </span>
        </h2>
        <p className="text-lg text-blue-100 max-w-3xl mx-auto">
          Tailored experiences for administrators, healthcare providers, and front desk staff
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role) => {
          const IconComponent = role.icon
          return (
            <div 
              key={role.id}
              className="flex flex-col"
            >
              {/* Badge */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-300 font-semibold">{role.badge}</span>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-sm text-blue-300 mb-4">
                {role.subtitle}
              </p>

              {/* Image Section */}
              <div className="relative h-48 overflow-hidden mb-6">
                <img 
                  src={role.image} 
                  alt={role.badge}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-100">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button - navigates to role selection (sign in) */}
              <Link to="/role-selection">
                <Button 
                  className={`w-full ${role.buttonColor} text-white group/btn border-0`}
                >
                  {role.buttonText}
                  <ArrowRightIcon className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}