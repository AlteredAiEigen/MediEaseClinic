import { MediEaseLogo } from "@/polymet/components/mediease-logo";

interface MediEaseLoaderProps {
  message?: string;
  subtext?: string;
  minHeight?: string;
  showBackdrop?: boolean;
}

export function MediEaseLoader({
  message = "Loading…",
  subtext,
  minHeight = "min-h-[300px]",
  showBackdrop = true,
}: MediEaseLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} gap-6 text-center relative`}>
      {showBackdrop && (
        <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-teal-100/60 via-emerald-100/50 to-teal-100/60 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-teal-950/40" />
      )}

      <div className="relative animate-pulse">
        <MediEaseLogo size="lg" showText={false} />
      </div>

      <div className="relative">
        <p className="text-base p-0 font-semibold text-foreground tracking-wide">{message}</p>
        {subtext ? (
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{subtext}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Please wait a moment while we get everything ready.</p>
        )}
      </div>
    </div>
  );
}
