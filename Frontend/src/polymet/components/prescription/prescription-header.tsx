import { Stethoscope } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function PrescriptionHeader() {
  const { user } = useAuth();

  const doctorName = user
    ? `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(" ").trim()}`
    : "Doctor";
  const clinicName = user?.clinicName?.trim() || "Clinic";
  const speciality = user?.speciality?.trim();
  const license = user?.licenseNumber?.trim();

  const clinicSubtitle = "Digital Prescription";

  return (
    <div className="border-b-2 border-primary pb-3 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">{clinicName}</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {clinicSubtitle}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-lg md:text-xl font-bold text-primary leading-tight">{doctorName}</h1>
          {license && <p className="text-xs font-semibold text-foreground">{license}</p>}
          {speciality && (
            <p className="text-[11px] text-muted-foreground">{speciality}</p>
          )}
        </div>
      </div>
    </div>
  );
}
