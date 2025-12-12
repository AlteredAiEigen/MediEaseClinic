import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LabResult {
  name: string;
  value: string;
  date: string;
  status: "normal" | "high" | "low";
  url?: string;
}

interface LabResultsCardProps {
  results?: LabResult[];
  className?: string;
}

export function LabResultsCard({ results = [], className = "" }: LabResultsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "text-amber-600 dark:text-amber-400";
      case "low":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-emerald-600 dark:text-emerald-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "high":
        return "High";
      case "low":
        return "Low";
      default:
        return "Normal";
    }
  };

  return (
    <Card className={`border-border shadow-md ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Recent Lab Results</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lab results available.</p>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index}>
                {index > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {result.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.date}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${getStatusColor(result.status)}`}
                    >
                      {result.value}
                    </p>
                    <p className={`text-xs ${getStatusColor(result.status)}`}>
                      {getStatusText(result.status)}
                    </p>
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-600 hover:underline"
                      >
                        View report
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
