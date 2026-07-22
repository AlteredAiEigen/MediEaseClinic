import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileTextIcon, FlaskConicalIcon, ExternalLinkIcon } from "lucide-react";

interface LabResult {
  name: string;
  value: string;
  date: string;
  status: "normal" | "high" | "low";
  url?: string;
  summary?: string;
  abnormalCount?: number;
  testCount?: number;
}

interface LabResultsCardProps {
  results?: LabResult[];
  className?: string;
}

export function LabResultsCard({ results = [], className = "" }: LabResultsCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "high":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "low":
        return "border-blue-200 bg-blue-50 text-blue-800";
      default:
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
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
    <Card className={`border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConicalIcon className="h-4 w-4 text-teal-600" />
          Recent Lab Results
          {results.length > 0 && <Badge variant="secondary" className="ml-auto font-normal">{results.length} reports</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No lab reports are available for this patient.
          </div>
        ) : (
          <Accordion type="single" collapsible className="overflow-hidden rounded-lg border">
            {results.map((result, index) => (
              <AccordionItem key={`${result.name}-${result.date}-${index}`} value={`report-${index}`} className="last:border-b-0">
                <AccordionTrigger className="px-3 py-3 no-underline hover:bg-slate-50 hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-3 text-left">
                    <div className="rounded-md bg-teal-50 p-2">
                      <FileTextIcon className="h-4 w-4 text-teal-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{result.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{result.date}</p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-xs ${getStatusStyle(result.status)}`}>
                      {result.abnormalCount
                        ? `${result.abnormalCount} abnormal`
                        : getStatusText(result.status)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t bg-slate-50/60 px-4 pt-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {result.testCount != null && <Badge variant="secondary">{result.testCount} parsed tests</Badge>}
                      {result.value && <Badge variant="secondary">{result.value}</Badge>}
                    </div>
                    {result.summary ? (
                      <p className="text-sm leading-6 text-slate-700">{result.summary}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No parsed report summary is available.</p>
                    )}
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline"
                      >
                        Open full report <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
