import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MailIcon, PhoneIcon, UsersIcon, BriefcaseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoctorCardProps {
  name: string;
  specialization: string;
  email: string;
  phone: string;
  patients: number;
  experience: string;
  avatar: string;
  status: "available" | "busy" | "off-duty";
  onViewProfile?: () => void;
  className?: string;
}

export function DoctorCard({
  name,
  specialization,
  email,
  phone,
  patients,
  experience,
  avatar,
  status,
  onViewProfile,
  className,
}: DoctorCardProps) {
  const statusConfig = {
    available: {
      color: "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20",
      label: "Available",
      dotColor: "bg-[#24B173]",
    },
    busy: {
      color: "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20",
      label: "Busy",
      dotColor: "bg-[#F7B731]",
    },
    "off-duty": {
      color: "bg-muted text-muted-foreground border-border",
      label: "Off Duty",
      dotColor: "bg-muted-foreground",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-[#00C4B3]/30",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-[#00C4B3]/20">
            <AvatarImage src={avatar} alt={name} />

            <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-sm">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
              config.dotColor
            )}
          />
        </div>

        <div className="space-y-0.5 w-full">
          <h3 className="font-semibold text-sm text-foreground truncate">{name}</h3>
          <p className="text-[10px] text-[#00C4B3] font-medium truncate">{specialization}</p>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", config.color)}>
            {config.label}
          </Badge>
        </div>

        <div className="w-full space-y-1 text-[10px]">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <UsersIcon className="w-2.5 h-2.5" />

            <span>{patients} Patients</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <BriefcaseIcon className="w-2.5 h-2.5" />

            <span className="truncate">{experience}</span>
          </div>
        </div>

        <div className="w-full pt-1.5 border-t border-border space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-center">
            <MailIcon className="w-2.5 h-2.5 flex-shrink-0" />

            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-center">
            <PhoneIcon className="w-2.5 h-2.5 flex-shrink-0" />

            <span className="truncate">{phone}</span>
          </div>
        </div>

        {onViewProfile && (
          <div className="w-full pt-1.5">
            <Button
              size="sm"
              onClick={onViewProfile}
              className="w-full bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white text-[10px] h-7 px-2"
            >
              View Profile
            </Button>
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#00C4B3]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
