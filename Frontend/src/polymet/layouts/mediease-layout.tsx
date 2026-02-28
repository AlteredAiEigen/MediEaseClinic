import { useState, createContext, useContext } from "react"
import { MedieaseHeader } from "@/polymet/components/mediease-header"
import { MedieaseFooter } from "@/polymet/components/mediease-footer"
import { MedieaseDemoForm } from "@/polymet/components/mediease-demo-form"

interface MedieaseLayoutProps {
  children: React.ReactNode
}

// Create context for demo form
interface DemoFormContextType {
  openDemoForm: () => void
}

const DemoFormContext = createContext<DemoFormContextType | undefined>(undefined)

export function useDemoForm() {
  const context = useContext(DemoFormContext)
  if (!context) {
    // Return a no-op function if context is not available
    // This prevents errors when components are rendered outside the layout
    return { openDemoForm: () => console.warn('useDemoForm called outside MedieaseLayout') }
  }
  return context
}

export function MedieaseLayout({ children }: MedieaseLayoutProps) {
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false)

  const openDemoForm = () => setIsDemoFormOpen(true)

  return (
    <DemoFormContext.Provider value={{ openDemoForm }}>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2847 25%, #1e3a5f 50%, #2563eb 100%)' }}>
        <MedieaseHeader onBookDemo={openDemoForm} />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <MedieaseFooter onBookDemo={openDemoForm} />
        <MedieaseDemoForm isOpen={isDemoFormOpen} onClose={() => setIsDemoFormOpen(false)} />
      </div>
    </DemoFormContext.Provider>
  )
}