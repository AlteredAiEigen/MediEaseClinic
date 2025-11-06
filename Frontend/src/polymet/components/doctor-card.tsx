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
        "group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-[#00C4B3]/30",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar className="w-20 h-20 border-4 border-[#00C4B3]/20">
            <AvatarImage src={avatar} alt={name} />

            <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-xl">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card",
              config.dotColor
            )}
          />
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-lg text-foreground">{name}</h3>
          <p className="text-sm text-[#00C4B3] font-medium">{specialization}</p>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.label}
          </Badge>
        </div>

        <div className="w-full space-y-2 text-sm">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <UsersIcon className="w-4 h-4" />

            <span>{patients} Patients</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <BriefcaseIcon className="w-4 h-4" />

            <span>{experience} Experience</span>
          </div>
        </div>

        <div className="w-full pt-2 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MailIcon className="w-3 h-3" />

            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <PhoneIcon className="w-3 h-3" />

            <span>{phone}</span>
          </div>
        </div>

        {onViewProfile && (
          <div className="w-full pt-2">
            <Button
              size="sm"
              onClick={onViewProfile}
              className="w-full bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
            >
              View Profile
            </Button>
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00C4B3]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
