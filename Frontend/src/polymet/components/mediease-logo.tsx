interface MediEaseLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  /** "dark" = white text (for dark backgrounds), "default" = dark ink text */
  variant?: "default" | "dark";
}

const PLUM_INK = "#2a0a18";

export function MediEaseLogo({
  size = "md",
  showText = true,
  className = "",
  variant = "default",
}: MediEaseLogoProps) {
  const imgSize = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12", xl: "h-14 w-14" }[size];
  const textSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl", xl: "text-3xl" }[size];
  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/landing-assets/mediease-logo.png"
        alt="MediEase"
        className={`${imgSize} rounded-xl object-contain`}
      />
      {showText && (
        <span
          className={`font-bold tracking-tight ${textSize}`}
          style={{
            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            color: isDark ? "#ffffff" : PLUM_INK,
          }}
        >
          MediEase
        </span>
      )}
    </div>
  );
}
