import { useEffect, useState } from "react";

interface MediEaseLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function MediEaseLoader({ 
  message = "Loading...", 
  size = "md",
  fullScreen = false 
}: MediEaseLoaderProps) {
  const [opacity, setOpacity] = useState(0.3);
  const [growing, setGrowing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity((prev) => {
        if (growing) {
          if (prev >= 1) {
            setGrowing(false);
            return 1;
          }
          return prev + 0.05;
        } else {
          if (prev <= 0.3) {
            setGrowing(true);
            return 0.3;
          }
          return prev - 0.05;
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, [growing]);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const containerClasses = fullScreen
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-background dark:via-background dark:to-teal-950/30"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00C4B3] to-[#10b981] opacity-20 animate-pulse" />
          
          {/* Logo with breathing effect */}
          <img
            src="https://assets.polymet.ai/lucky-lavender-883645"
            alt="MediEase"
            className={`${sizeClasses[size]} rounded-2xl relative z-10 transition-opacity duration-100`}
            style={{ opacity }}
          />
          
          {/* Spinning border */}
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-2xl`}>
            <div className="absolute inset-0 rounded-2xl border-4 border-transparent border-t-[#00C4B3] border-r-[#10b981] animate-spin" />
          </div>
        </div>
        
        <div className="space-y-1">
          <p className={`${textSizeClasses[size]} font-medium bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent`}>
            {message}
          </p>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-[#00C4B3] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-[#00C4B3] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-[#00C4B3] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

