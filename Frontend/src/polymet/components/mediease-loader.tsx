import { MediEaseLogo } from "@/polymet/components/mediease-logo";

interface MediEaseLoaderProps {
  children?: React.ReactNode;
}

export function MediEaseLoader({ children }: MediEaseLoaderProps) {
  return (
    <>
      {/* Translucent overlay with blurred background - only covers main content area */}
      <div className="fixed inset-0 lg:left-72 bg-background/60 backdrop-blur-[2px] z-40 flex items-center justify-center">
        <div className="relative animate-pulse">
          <MediEaseLogo size="lg" showText={false} />
        </div>
      </div>

      {/* Dimmed background content */}
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </>
  );
}
