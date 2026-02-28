import { Link } from "react-router-dom"
import { LinkedinIcon } from "lucide-react"
import { MediEaseLogo } from "@/polymet/components/mediease-logo"

interface MedieaseFooterProps {
  onBookDemo?: () => void
}

export function MedieaseFooter({ onBookDemo }: MedieaseFooterProps = {}) {
  return (
    <footer className="bg-gradient-to-b from-blue-950 via-slate-950 to-slate-950 dark:bg-gradient-to-b dark:from-blue-950 dark:via-slate-950 dark:to-slate-950 border-t border-blue-900/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Section with Logo and Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MediEaseLogo size="sm" variant="dark" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Transforming healthcare with AI and digital innovation for Indian clinics and hospitals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/how-it-works" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <button 
                  onClick={onBookDemo}
                  className="text-sm text-slate-400 hover:text-cyan-400 transition-colors text-left"
                >
                  Book a Demo
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about-us" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terms-of-service" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © 2025 MediEase. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.linkedin.com/company/medieaseclinic/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">
              <LinkedinIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}