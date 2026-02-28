import { MedieaseHero } from "@/polymet/components/mediease-hero"
import { MedieaseDemoPlaceholder } from "@/polymet/components/mediease-demo-placeholder"
import { MedieaseLanguages } from "@/polymet/components/mediease-languages"
import { MedieaseSolutions } from "@/polymet/components/mediease-solutions"
import { MedieaseWorkflow } from "@/polymet/components/mediease-workflow"
import { MedieaseRolesSection } from "@/polymet/components/mediease-roles-section"
import { MedieaseTechnologyCta } from "@/polymet/components/mediease-technology-cta"
import { useDemoForm } from "@/polymet/layouts/mediease-layout"

export function MedieaseLanding() {
  const { openDemoForm } = useDemoForm()
  return (
    <div className="w-full" style={{ background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 40%, #1d4ed8 100%)' }}>
      {/* Hero - Flat on gradient */}
      <MedieaseHero onBookDemo={openDemoForm} />
      
      {/* Demo - Flat on gradient */}
      <div className="py-12">
        <MedieaseDemoPlaceholder />
      </div>
      
      {/* Solutions - Flat on gradient */}
      <div className="py-12">
        <MedieaseSolutions />
      </div>
      
      {/* Languages - Flat on gradient */}
      <div className="py-12">
        <MedieaseLanguages />
      </div>
      
      {/* Roles - Flat on gradient */}
      <div className="py-12">
        <MedieaseRolesSection />
      </div>
      
      {/* Workflow - Flat on gradient */}
      <div className="py-12">
        <MedieaseWorkflow />
      </div>
      
      {/* CTA - Flat on gradient */}
      <div className="py-12">
        <MedieaseTechnologyCta />
      </div>
    </div>
  )
}