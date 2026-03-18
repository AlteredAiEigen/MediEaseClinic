interface MediEaseLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  /** Use "dark" for dark backgrounds (header, footer) - makes text white/cyan */
  variant?: "default" | "dark";
}

export function MediEaseLogo({
  size = "md",
  showText = true,
  className = "",
  variant = "default",
}: MediEaseLogoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36",
  };

  const textSizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl",
  };

  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/mediease-logo.svg"
        alt="MediEase Logo"
        className={`${sizeClasses[size]} rounded-xl`}
      />

      {showText && (
        <div className="flex flex-col">
          <span
            className={`${textSizeClasses[size]} font-bold ${
              isDark
                ? "text-white"
                : "bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent"
            }`}
          >
            MediEase
          </span>
          <span className={`text-sm -mt-1 ${isDark ? "text-cyan-400" : "text-muted-foreground"}`}>
            Clinic
          </span>
        </div>
      )}
    </div>
  );
}
