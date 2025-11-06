import { ClockIcon, UserIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingAppointmentCardProps {
  patientName: string;
  time: string;
  appointmentType: string;
  avatar: string;
  status?: "scheduled" | "confirmed" | "waiting";
  onClick?: () => void;
  className?: string;
}

export function UpcomingAppointmentCard({
  patientName,
  time,
  appointmentType,
  avatar,
  status = "scheduled",
  onClick,
  className,
}: UpcomingAppointmentCardProps) {
  const statusColors = {
    scheduled:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    confirmed:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    waiting:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={patientName}
          className="w-12 h-12 rounded-lg object-cover ring-2 ring-background shadow-sm"
        />

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">
            {patientName}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <ClockIcon className="w-3 h-3 text-muted-foreground" />

            <span className="text-sm text-muted-foreground">{time}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium",
              statusColors[status]
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
          <span className="text-xs text-muted-foreground">
            {appointmentType}
          </span>
        </div>
      </div>
    </div>
  );
}
