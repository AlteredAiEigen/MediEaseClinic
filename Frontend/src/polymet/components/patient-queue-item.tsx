import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClockIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientQueueItemProps {
  patientName: string;
  patientId: string;
  time: string;
  status: "checked-in" | "waiting" | "in-consultation" | "completed";
  condition: string;
  avatar: string;
  onCheckIn?: () => void;
  onViewProfile?: () => void;
  className?: string;
}

export function PatientQueueItem({
  patientName,
  patientId,
  time,
  status,
  condition,
  avatar,
  onCheckIn,
  onViewProfile,
  className,
}: PatientQueueItemProps) {
  const statusConfig = {
    "checked-in": {
      color: "bg-[#33A8FF]/10 text-[#33A8FF] border-[#33A8FF]/20",
      label: "Checked In",
      dotColor: "bg-[#33A8FF]",
    },
    waiting: {
      color: "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20",
      label: "Waiting",
      dotColor: "bg-[#F7B731]",
    },
    "in-consultation": {
      color: "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20",
      label: "In Consultation",
      dotColor: "bg-[#00C4B3]",
    },
    completed: {
      color: "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20",
      label: "Completed",
      dotColor: "bg-[#24B173]",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-[#00C4B3]/30",
        className
      )}
    >
      <div className="relative">
        <Avatar className="w-12 h-12 border-2 border-[#00C4B3]/20">
          <AvatarImage src={avatar} alt={patientName} />

          <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
            {patientName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
            config.dotColor
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {patientName}
            </h4>
            <p className="text-xs text-muted-foreground">{patientId}</p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs whitespace-nowrap", config.color)}
          >
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate mb-2">
          {condition}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="w-3 h-3" />

          <span>{time}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {onCheckIn && status === "waiting" && (
          <Button
            size="sm"
            onClick={onCheckIn}
            className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
          >
            Check In
          </Button>
        )}
        {onViewProfile && (
          <Button
            size="sm"
            variant="outline"
            onClick={onViewProfile}
            className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
          >
            View
          </Button>
        )}
      </div>
    </div>
  );
}
