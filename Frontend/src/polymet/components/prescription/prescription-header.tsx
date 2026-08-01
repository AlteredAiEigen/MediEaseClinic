import { Stethoscope } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export interface PrescriptionLetterhead {
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  doctorName?: string;
  doctorSpeciality?: string;
  doctorLicense?: string;
}

interface PrescriptionHeaderProps {
  letterhead?: PrescriptionLetterhead | null;
}

export function PrescriptionHeader({ letterhead }: PrescriptionHeaderProps) {
  const { user } = useAuth();

  const accountDoctorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const rawDoctorName = letterhead?.doctorName?.trim() || accountDoctorName;
  const doctorName = rawDoctorName
    ? /^dr\.?\s/i.test(rawDoctorName)
      ? rawDoctorName
      : `Dr. ${rawDoctorName}`
    : "";
  const clinicName = letterhead?.clinicName?.trim() || user?.clinicName?.trim() || "";
  const clinicAddress = letterhead?.clinicAddress?.trim() || "";
  const speciality = letterhead?.doctorSpeciality?.trim() || user?.speciality?.trim();
  const license = letterhead?.doctorLicense?.trim() || user?.licenseNumber?.trim();

  return (
    <div
      className="border-b-2 border-emerald-600 pb-3 mb-5"
      style={{ borderBottomColor: "#059669" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-emerald-700/10 flex items-center justify-center shrink-0">
            <Stethoscope className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {clinicName || "—"}
            </h2>
            {clinicAddress && (
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {clinicAddress}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-lg md:text-xl font-bold text-emerald-700 leading-tight">
            {doctorName || "—"}
          </h1>
          {license && <p className="text-xs font-semibold text-foreground">{license}</p>}
          {speciality && (
            <p className="text-[11px] text-muted-foreground">{speciality}</p>
          )}
        </div>
      </div>
    </div>
  );
}
