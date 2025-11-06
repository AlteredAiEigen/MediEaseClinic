import { useState } from "react";
import {
  UserIcon,
  ClockIcon,
  ActivityIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QueuePatient {
  id: string;
  name: string;
  avatar: string;
  checkInTime: string;
  waitTime: string;
  status: "waiting" | "in-consultation" | "completed";
  priority?: "high" | "normal";
}

interface PatientQueueCardProps {
  patients: QueuePatient[];
  onMoveToConsultation?: (patientId: string) => void;
  onComplete?: (patientId: string) => void;
  className?: string;
}

export function PatientQueueCard({
  patients,
  onMoveToConsultation,
  onComplete,
  className,
}: PatientQueueCardProps) {
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleStatusChange = (
    patientId: string,
    action: "consult" | "complete"
  ) => {
    setAnimatingId(patientId);
    setTimeout(() => {
      if (action === "consult" && onMoveToConsultation) {
        onMoveToConsultation(patientId);
      } else if (action === "complete" && onComplete) {
        onComplete(patientId);
      }
      setAnimatingId(null);
    }, 300);
  };

  const getStatusConfig = (status: QueuePatient["status"]) => {
    switch (status) {
      case "waiting":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/20",
          border: "border-amber-200 dark:border-amber-800",
          badge:
            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
          icon: <ClockIcon className="w-4 h-4" />,
        };
      case "in-consultation":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/20",
          border: "border-blue-200 dark:border-blue-800",
          badge:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
          icon: <ActivityIcon className="w-4 h-4" />,
        };
      case "completed":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
          border: "border-emerald-200 dark:border-emerald-800",
          badge:
            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
          icon: <CheckCircleIcon className="w-4 h-4" />,
        };
    }
  };

  const waitingCount = patients.filter((p) => p.status === "waiting").length;
  const inConsultationCount = patients.filter(
    (p) => p.status === "in-consultation"
  ).length;

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-6 border border-border shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Today's Patient Queue
            </h3>
            <p className="text-xs text-muted-foreground">
              {waitingCount} waiting · {inConsultationCount} in consultation
            </p>
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {patients.length}
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {patients.map((patient) => {
          const config = getStatusConfig(patient.status);
          const isAnimating = animatingId === patient.id;

          return (
            <div
              key={patient.id}
              className={cn(
                "rounded-xl p-4 border transition-all duration-300",
                config.bg,
                config.border,
                isAnimating && "scale-95 opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={patient.avatar}
                    alt={patient.name}
                    className="w-12 h-12 rounded-lg object-cover ring-2 ring-background shadow-sm"
                  />

                  {patient.priority === "high" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {patient.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Check-in: {patient.checkInTime}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Wait: {patient.waitTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      config.badge
                    )}
                  >
                    {config.icon}
                    {patient.status === "waiting" && "Waiting"}
                    {patient.status === "in-consultation" && "In Progress"}
                    {patient.status === "completed" && "Completed"}
                  </div>

                  {patient.status === "waiting" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(patient.id, "consult")}
                      className="h-8 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Start
                      <ArrowRightIcon className="w-3 h-3 ml-1" />
                    </Button>
                  )}

                  {patient.status === "in-consultation" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(patient.id, "complete")}
                      className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Complete
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
