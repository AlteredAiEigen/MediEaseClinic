import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ClockIcon,
  PillIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ActivityIcon,
  UserIcon,
} from "lucide-react";
import { get } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

interface VisitHistoryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  doctor: string;
  chiefComplaint?: string;
  treatment?: string;
  followUp?: string;
  appointmentId?: string;
  hasPrescription?: boolean;
  sortTimestamp: number;
}

interface PatientVisitHistoryProps {
  visits: VisitHistoryItem[];
  patientId: string;
  className?: string;
}

export function PatientVisitHistory({
  visits,
  patientId,
  className = "",
}: PatientVisitHistoryProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openingPrescriptionId, setOpeningPrescriptionId] = useState<string | null>(null);
  const recentVisits = [...visits]
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp)
    .slice(0, 5);

  const openPrescription = async (appointmentId: string) => {
    setOpeningPrescriptionId(appointmentId);
    try {
      const response = await get<{ presignedUrl?: string }>(
        `/api/appointments/${appointmentId}/prescription/presigned-url`,
      );
      const url = response.data?.presignedUrl;
      if (!response.success || !url) {
        throw new Error(response.message || "Prescription file is unavailable.");
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Could not open prescription",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setOpeningPrescriptionId(null);
    }
  };

  return (
    <Card className={`border-slate-200 shadow-sm ${className}`}>
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <CardContent className="p-0">
          <CollapsibleTrigger className="flex w-full items-center gap-2 p-4 text-left">
            <ActivityIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-base font-semibold text-foreground">Visit History</h3>
            <Badge variant="outline" className="ml-auto text-xs">
              {Math.min(visits.length, 5)} of {visits.length} visits
            </Badge>
            {historyOpen ? (
              <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </CardContent>
        <CollapsibleContent>
          <CardContent className="pt-0">
      <div className="relative ml-2 space-y-3 border-l-2 border-teal-100 pl-5">
        {visits.length === 0 && (
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 text-sm text-muted-foreground">
              No visit history available.
            </CardContent>
          </Card>
        )}

        {recentVisits.map((visit) => {
          return (
            <Card
              key={visit.id}
              className="relative border-slate-200 shadow-sm"
            >
              <span className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
              <CardContent className="p-3.5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground">{visit.title}</h4>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium">Date:</span> {visit.date}
                      </p>
                      {visit.doctor && visit.doctor !== "Doctor" && (
                        <p className="inline-flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span className="font-medium">Doctor:</span> Dr. {visit.doctor}
                        </p>
                      )}
                      {visit.time !== "—" && (
                        <p className="inline-flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span className="font-medium">Time:</span> {visit.time}
                        </p>
                      )}
                    </div>
                    {(visit.chiefComplaint || visit.treatment || visit.followUp) && (
                      <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        {visit.chiefComplaint && (
                          <p className="line-clamp-2">
                            <span className="font-medium text-foreground">Chief Complaint:</span>{" "}
                            {visit.chiefComplaint}
                          </p>
                        )}
                        {visit.treatment && (
                          <p className="line-clamp-2">
                            <span className="font-medium text-foreground">Treatment:</span>{" "}
                            {visit.treatment}
                          </p>
                        )}
                        {visit.followUp && (
                          <p className="line-clamp-2">
                            <span className="font-medium text-foreground">Follow-up:</span>{" "}
                            {visit.followUp}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {visit.hasPrescription && visit.appointmentId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 border-purple-200 bg-purple-50 px-2 text-xs text-purple-700 hover:bg-purple-100"
                        disabled={openingPrescriptionId === visit.appointmentId}
                        onClick={() => void openPrescription(visit.appointmentId!)}
                      >
                        <PillIcon className="mr-1 h-3 w-3" />
                        {openingPrescriptionId === visit.appointmentId ? "Opening..." : "Prescription File"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
