import { useState } from "react";
import {
  ClockIcon,
  UserIcon,
  FileTextIcon,
  AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NextPatientCardProps {
  patientName: string;
  patientId: string;
  time: string;
  appointmentType: string;
  condition: string;
  avatar: string;
  urgency?: "high" | "medium" | "low";
  notes?: string;
  onStartConsultation?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function NextPatientCard({
  patientName,
  patientId,
  time,
  appointmentType,
  condition,
  avatar,
  urgency = "medium",
  notes,
  onStartConsultation,
  onViewDetails,
  className,
}: NextPatientCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const urgencyColors = {
    high: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
    medium:
      "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
    low: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
  };

  const urgencyBadgeColors = {
    high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    medium:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    low: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Next Patient Badge */}
      <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
        Next Patient
      </div>

      <div className="flex items-start gap-4 mt-2">
        {/* Patient Avatar */}
        <div className="relative">
          <img
            src={avatar}
            alt={patientName}
            className="w-16 h-16 rounded-xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-md"
          />

          {urgency === "high" && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
          )}
        </div>

        {/* Patient Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {patientName}
              </h3>
              <p className="text-sm text-muted-foreground">{patientId}</p>
            </div>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                urgencyBadgeColors[urgency]
              )}
            >
              {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="w-4 h-4 text-blue-500" />

              <span className="font-semibold text-foreground">{time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileTextIcon className="w-4 h-4 text-indigo-500" />

              <span className="text-muted-foreground">{appointmentType}</span>
            </div>
          </div>

          <div
            className={cn("rounded-lg p-3 mb-4 border", urgencyColors[urgency])}
          >
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 mt-0.5 text-foreground" />

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Chief Complaint
                </p>
                <p className="text-sm text-muted-foreground">{condition}</p>
              </div>
            </div>
          </div>

          {/* Hover Preview */}
          {isHovered && notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 border border-border shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Quick Notes
              </p>
              <p className="text-sm text-foreground">{notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onStartConsultation}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md"
            >
              Start Consultation
            </Button>
            <Button
              onClick={onViewDetails}
              variant="outline"
              className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
