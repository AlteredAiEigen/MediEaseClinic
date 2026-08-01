import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PatientDetailsProps {
  patientName: string;
  setPatientName: (v: string) => void;
  patientAge: string;
  setPatientAge: (v: string) => void;
  patientGender: string;
  setPatientGender: (v: string) => void;
  patientPhone: string;
  setPatientPhone: (v: string) => void;
  bp?: string;
  setBp?: (v: string) => void;
  pulse?: string;
  setPulse?: (v: string) => void;
  spo2?: string;
  setSpo2?: (v: string) => void;
  diagnosis: string;
  setDiagnosis: (v: string) => void;
  readOnlyPatient?: boolean;
  showVitals?: boolean;
}

export function PrescriptionPatientDetails(props: PatientDetailsProps) {
  const readOnly = props.readOnlyPatient ?? false;
  const showVitals = props.showVitals ?? false;

  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-5">
          <Label className="text-xs text-muted-foreground">Patient Name</Label>
          <Input
            value={props.patientName}
            onChange={(e) => props.setPatientName(e.target.value)}
            placeholder="Patient Name"
            className="h-8 text-sm"
            readOnly={readOnly}
          />
        </div>
        <div className="col-span-4 md:col-span-2">
          <Label className="text-xs text-muted-foreground">Age</Label>
          <Input
            value={props.patientAge}
            onChange={(e) => props.setPatientAge(e.target.value)}
            placeholder="Age"
            className="h-8 text-sm"
            type="number"
            readOnly={readOnly}
          />
        </div>
        <div className="col-span-8 md:col-span-2">
          <Label className="text-xs text-muted-foreground">Gender</Label>
          <select
            value={props.patientGender}
            onChange={(e) => props.setPatientGender(e.target.value)}
            disabled={readOnly}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label className="text-xs text-muted-foreground">Phone</Label>
          <Input
            value={props.patientPhone}
            onChange={(e) => props.setPatientPhone(e.target.value)}
            placeholder="Phone"
            className="h-8 text-sm"
            readOnly={readOnly}
          />
        </div>
      </div>

      {showVitals && props.setBp && props.setPulse && props.setSpo2 && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">BP</Label>
            <Input
              value={props.bp || ""}
              onChange={(e) => props.setBp?.(e.target.value)}
              placeholder="140/90 mmHg"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Pulse</Label>
            <Input
              value={props.pulse || ""}
              onChange={(e) => props.setPulse?.(e.target.value)}
              placeholder="88 bpm"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">SPO2</Label>
            <Input
              value={props.spo2 || ""}
              onChange={(e) => props.setSpo2?.(e.target.value)}
              placeholder="98%"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground font-semibold">Diagnosis</Label>
        <Textarea
          value={props.diagnosis}
          onChange={(e) => props.setDiagnosis(e.target.value)}
          placeholder="e.g. DIABETES MELLITUS TYPE 2, HYPOTHYROIDISM, HYPERTENSION"
          className="text-sm mt-1 min-h-[60px] font-medium uppercase resize-y w-full"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
