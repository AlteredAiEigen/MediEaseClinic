import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  PillIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ActivityIcon,
} from "lucide-react";

interface VisitHistoryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  doctor: string;
  relativeTime: string;
  prescription?: string[];
  clinicalNotes?: string;
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
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  const toggleExpand = (visitId: string) => {
    setExpandedVisit(expandedVisit === visitId ? null : visitId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />

          <h3 className="text-lg font-semibold text-foreground">
            Visit History
          </h3>
          <Badge variant="outline" className="text-xs">
            {visits.length} visits
          </Badge>
        </div>
        {/* HIPAA: Full patient history link removed (available only in active consultation) */}
      </div>

      <div className="relative border-l-2 border-teal-100 ml-2 pl-5 space-y-4">
        {visits.length === 0 && (
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 text-sm text-muted-foreground">
              No visit history available.
            </CardContent>
          </Card>
        )}

        {visits.map((visit) => {
          const isExpanded = expandedVisit === visit.id;

          return (
            <Card
              key={visit.id}
              className={`
                relative border-slate-200 shadow-sm transition-shadow cursor-pointer hover:shadow-md
                ${isExpanded ? "ring-2 ring-teal-500" : ""}
              `}
              onClick={() => toggleExpand(visit.id)}
            >
              <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
              <CardContent className="p-4">
                {/* Compact View */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />

                        <span className="font-medium text-foreground">
                          {visit.date}
                        </span>
                        <span className="text-xs">•</span>
                        <ClockIcon className="w-3.5 h-3.5" />

                        <span>{visit.time}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800"
                      >
                        {visit.relativeTime}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-foreground mb-1 truncate">
                      {visit.title}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {visit.description}
                    </p>

                    {!isExpanded && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <FileTextIcon className="w-3.5 h-3.5" />

                        <span>Dr. {visit.doctor}</span>
                        {visit.prescription &&
                          visit.prescription.length > 0 && (
                            <>
                              <span>•</span>
                              <PillIcon className="w-3.5 h-3.5" />

                              <span>
                                {visit.prescription.length} medications
                              </span>
                            </>
                          )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(visit.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <Separator />

                    {/* Doctor Info */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Attending Physician
                      </p>
                      <p className="text-sm text-foreground">
                        Dr. {visit.doctor}
                      </p>
                    </div>

                    {/* Prescription */}
                    {visit.prescription && visit.prescription.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PillIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />

                          <p className="text-xs font-semibold text-foreground">
                            Prescription
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {visit.prescription.map((med, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md"
                            >
                              {med}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clinical Notes */}
                    {visit.clinicalNotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileTextIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />

                          <p className="text-xs font-semibold text-foreground">
                            Clinical Notes
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                          {visit.clinicalNotes}
                        </p>
                      </div>
                    )}

                    {/* HIPAA: Patient overview link removed */}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More Button */}
      {/* HIPAA: removed patient overview navigation */}
    </div>
  );
}
