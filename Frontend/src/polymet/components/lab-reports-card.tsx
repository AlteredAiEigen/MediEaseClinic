import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlaskConicalIcon, MessageSquareIcon, CheckIcon } from "lucide-react";

interface LabReport {
  id: string;
  patientName: string;
  patientAvatar: string;
  reportType: string;
  date: string;
  time: string;
  priority?: "high" | "normal";
  status?: "pending" | "reviewed";
}

interface LabReportsCardProps {
  reports: LabReport[];
  onView?: (reportId: string) => void;
  onMessage?: (reportId: string) => void;
  onMarkReviewed?: (reportId: string) => void;
  className?: string;
}

export function LabReportsCard({
  reports,
  onView,
  onMessage,
  onMarkReviewed,
  className = "",
}: LabReportsCardProps) {
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <Card className={`border-border shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-2 rounded-lg">
              <FlaskConicalIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">New Lab Reports</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingCount} reports awaiting review
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-xs"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={report.patientAvatar}
                alt={report.patientName}
              />

              <AvatarFallback>{report.patientName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {report.patientName}
                </p>
                {report.priority === "high" && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    High Priority
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {report.reportType}
              </p>
              <p className="text-xs text-muted-foreground">
                {report.date} at {report.time}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={() => onView?.(report.id)}
              >
                <span className="sr-only">View</span>
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={() => onMessage?.(report.id)}
              >
                <MessageSquareIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
              {report.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  onClick={() => onMarkReviewed?.(report.id)}
                >
                  <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
