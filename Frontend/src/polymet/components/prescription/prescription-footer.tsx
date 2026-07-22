import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

interface PrescriptionFooterProps {
  prescribedTests: string;
  setPrescribedTests: (v: string) => void;
  nextAppointment: string;
  setNextAppointment: (v: string) => void;
  readOnly?: boolean;
}

export function PrescriptionFooter(props: PrescriptionFooterProps) {
  const { user } = useAuth();
  const clinicPhone = user?.phone?.trim();
  const readOnly = props.readOnly ?? false;

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <div className="w-full">
        <Label className="text-xs text-muted-foreground font-semibold">
          निर्धारित परीक्षण (Prescribed Tests)
        </Label>
        <Textarea
          value={props.prescribedTests}
          onChange={(e) => props.setPrescribedTests(e.target.value)}
          placeholder="Type freely — e.g. CBC, ECG, KFT, HBA1C, URINE R/M, CHEST X RAY PA, RBS, THYROID PROFILE"
          className="text-sm mt-1 min-h-[72px] w-full resize-y"
          readOnly={readOnly}
        />
      </div>
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground font-semibold whitespace-nowrap">
          अगली तारीख़ (Next Appointment)
        </Label>
        <Input
          type="date"
          value={props.nextAppointment}
          onChange={(e) => props.setNextAppointment(e.target.value)}
          className="h-8 text-sm w-48"
          disabled={readOnly}
        />
      </div>
      {clinicPhone && (
        <div className="mt-6 pt-4 border-t border-dashed border-border text-[10px] text-muted-foreground space-y-1">
          <p>📞 For Appointment Call/Whatsapp: {clinicPhone}</p>
        </div>
      )}
    </div>
  );
}
