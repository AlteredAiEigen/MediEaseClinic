import {
  SparklesIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Insight {
  id: string;
  type: "recommendation" | "alert" | "success" | "trend";
  title: string;
  description: string;
  confidence?: number;
  action?: string;
  onAction?: () => void;
}

interface AIInsightsCardProps {
  insights: Insight[];
  className?: string;
}

export function AIInsightsCard({ insights, className }: AIInsightsCardProps) {
  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "recommendation":
        return <SparklesIcon className="w-5 h-5" />;

      case "alert":
        return <AlertTriangleIcon className="w-5 h-5" />;

      case "success":
        return <CheckCircleIcon className="w-5 h-5" />;

      case "trend":
        return <TrendingUpIcon className="w-5 h-5" />;
    }
  };

  const getInsightColors = (type: Insight["type"]) => {
    switch (type) {
      case "recommendation":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/20",
          border: "border-purple-200 dark:border-purple-800",
          icon: "text-purple-600 dark:text-purple-400",
          badge:
            "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
        };
      case "alert":
        return {
          bg: "bg-red-50 dark:bg-red-950/20",
          border: "border-red-200 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        };
      case "success":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
          border: "border-emerald-200 dark:border-emerald-800",
          icon: "text-emerald-600 dark:text-emerald-400",
          badge:
            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
        };
      case "trend":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          badge:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
        };
    }
  };

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-6 border border-border shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-2 rounded-lg">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            AI-Powered Insights
          </h3>
          <p className="text-xs text-muted-foreground">
            Actionable recommendations for better care
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const colors = getInsightColors(insight.type);
          return (
            <div
              key={insight.id}
              className={cn(
                "rounded-xl p-4 border transition-all duration-200 hover:shadow-sm",
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", colors.icon)}>
                  {getInsightIcon(insight.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-foreground text-sm">
                      {insight.title}
                    </h4>
                    {insight.confidence && (
                      <div
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          colors.badge
                        )}
                      >
                        {insight.confidence}% confidence
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>

                  {insight.action && (
                    <Button
                      onClick={insight.onAction}
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs font-medium hover:bg-background/50"
                    >
                      {insight.action}
                      <ArrowRightIcon className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
