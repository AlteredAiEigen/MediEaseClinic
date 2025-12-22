import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClockIcon, UserIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  patientName: string;
  time: string;
  type: "consultation" | "follow-up" | "emergency" | "checkup";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  reason: string;
  avatar: string;
  onViewDetails?: () => void;
  className?: string;
}

export function AppointmentCard({
  patientName,
  time,
  type,
  status,
  reason,
  avatar,
  onViewDetails,
  className,
}: AppointmentCardProps) {
  const typeColors = {
    consultation: "bg-[#33A8FF]/10 text-[#33A8FF] border-[#33A8FF]/20",
    "follow-up": "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20",
    emergency: "bg-[#FF4F6E]/10 text-[#FF4F6E] border-[#FF4F6E]/20",
    checkup: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
  };

  const statusColors = {
    scheduled: "bg-[#33A8FF]/10 text-[#33A8FF]",
    "in-progress": "bg-[#F7B731]/10 text-[#F7B731]",
    completed: "bg-[#24B173]/10 text-[#24B173]",
    cancelled: "bg-[#FF4F6E]/10 text-[#FF4F6E]",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-[#00C4B3]/30",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 border-2 border-[#00C4B3]/20">
          <AvatarImage src={avatar} alt={patientName} />

          <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
            {patientName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-foreground">{patientName}</h4>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs", statusColors[status])}
            >
              {status.replace("-", " ")}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />

              <span>{time}</span>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs", typeColors[type])}
            >
              {type}
            </Badge>
          </div>

          {/* HIPAA: View Details removed; patient profile is only accessible inside active consultation */}
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#00C4B3]/5 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
