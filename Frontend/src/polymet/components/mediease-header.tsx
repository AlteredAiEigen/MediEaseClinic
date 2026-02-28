import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { MediEaseLogo } from "@/polymet/components/mediease-logo"

interface MedieaseHeaderProps {
  onBookDemo?: () => void
}

export function MedieaseHeader({ onBookDemo }: MedieaseHeaderProps = {}) {
  const { user } = useAuth()

  const getLogoLink = () => {
    if (!user) return "/"
    switch (user.role) {
      case "admin":
        return "/admin-dashboard"
      case "doctor":
        return "/doctor-dashboard"
      case "receptionist":
        return "/receptionist-dashboard"
      default:
        return "/"
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-400/30 via-blue-400/30 to-cyan-400/30 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={getLogoLink()} className="flex items-center gap-2">
            <MediEaseLogo size="sm" variant="dark" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/how-it-works" className="text-sm font-medium text-blue-50/90 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-blue-50/90 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/about-us" className="text-sm font-medium text-blue-50/90 hover:text-white transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium text-blue-50/90 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/role-selection">
              <Button variant="ghost" className="hidden sm:inline-flex text-blue-50/90 hover:text-white hover:bg-blue-900/50">
                Sign In
              </Button>
            </Link>
            <Button 
              onClick={onBookDemo}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}