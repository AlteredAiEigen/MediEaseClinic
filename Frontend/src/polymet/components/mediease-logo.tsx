interface MediEaseLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function MediEaseLogo({
  size = "md",
  showText = true,
  className = "",
}: MediEaseLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="https://assets.polymet.ai/lucky-lavender-883645"
        alt="MediEase Logo"
        className={`${sizeClasses[size]} rounded-xl`}
      />

      {showText && (
        <div className="flex flex-col">
          <span
            className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent`}
          >
            MediEase
          </span>
          <span className="text-xs text-muted-foreground -mt-1">Clinic</span>
        </div>
      )}
    </div>
  );
}
