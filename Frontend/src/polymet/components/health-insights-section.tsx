import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon, ActivityIcon } from "lucide-react";

interface HealthMetric {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
  status: "good" | "warning" | "critical";
}

export function HealthInsightsSection() {
  const metrics: HealthMetric[] = [
    {
      title: "Patient Satisfaction",
      value: "4.8/5.0",
      change: 5,
      trend: "up",
      status: "good",
    },
    {
      title: "Avg. Consultation Time",
      value: "18 min",
      change: 12,
      trend: "down",
      status: "good",
    },
    {
      title: "Follow-up Rate",
      value: "92%",
      change: 8,
      trend: "up",
      status: "good",
    },
    {
      title: "No-Show Rate",
      value: "3.2%",
      change: 15,
      trend: "down",
      status: "good",
    },
  ];

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg">
              <ActivityIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Health Insights</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time patient health analytics
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <p className="text-xs text-muted-foreground mb-1">
                {metric.title}
              </p>
              <p className="text-xl font-bold text-foreground mb-2">
                {metric.value}
              </p>
              <div className="flex items-center gap-1">
                {metric.trend === "up" ? (
                  <TrendingUpIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDownIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {metric.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
