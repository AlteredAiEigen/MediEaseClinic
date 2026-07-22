type DigitalRxMedicine = {
  name: string;
  type: string;
  composition: string;
  dosageMorning: number;
  dosageAfternoon: number;
  dosageNight: number;
  timingFreqDuration: string;
  quantity: number;
};

export type DigitalRxSavePayload = {
  patientMongoId: string;
  patientName: string;
  diagnosis: string;
  prescribedTests: string;
  nextAppointment: string;
  medicines: DigitalRxMedicine[];
};

export function mapDigitalRxMedicine(m: DigitalRxMedicine) {
  const parts = m.timingFreqDuration
    .split(/\s[-–—]\s/)
    .map((s) => s.trim())
    .filter((s) => s && !/^[-–—]+$/.test(s) && !/^(n\/?a|none|null)$/i.test(s));

  let timing = "";
  let frequency = "";
  let duration = "";
  if (parts.length >= 3) {
    timing = parts[0];
    frequency = parts[parts.length - 2];
    duration = parts[parts.length - 1];
  } else if (parts.length === 2) {
    timing = parts[0];
    frequency = parts[1];
  } else if (parts.length === 1) {
    timing = parts[0];
  }

  const dosage = `${m.dosageMorning}-${m.dosageAfternoon}-${m.dosageNight}`;

  return {
    name: m.name.trim(),
    dosage,
    frequency,
    duration,
    instructions: timing,
    medicineType: m.type,
    composition: m.composition || undefined,
    quantity: m.quantity > 0 ? m.quantity : undefined,
  };
}

export function buildDigitalRxNotes(payload: DigitalRxSavePayload): string {
  return [
    payload.prescribedTests && `Tests: ${payload.prescribedTests}`,
    payload.nextAppointment && `Next appointment: ${payload.nextAppointment}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPrescriptionSummary(medicines: DigitalRxMedicine[]): string {
  return medicines
    .filter((m) => m.name?.trim())
    .map((m) => {
      const mapped = mapDigitalRxMedicine(m);
      return `${mapped.name} — ${mapped.dosage} — ${mapped.frequency} — ${mapped.duration}`;
    })
    .join("\n");
}

export function parsePrescribedTestsFromNotes(notes: string): string {
  for (const line of notes.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("tests:")) {
      return trimmed.slice(6).trim();
    }
  }
  return "";
}

export function parseNextAppointmentFromNotes(notes: string): string {
  for (const line of notes.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("next appointment:")) {
      return trimmed.slice("next appointment:".length).trim();
    }
  }
  return "";
}

export type SavedPrescriptionMedication = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  medicineType?: string;
  composition?: string;
  quantity?: number;
};

export type SavedPrescription = {
  _id: string;
  prescriptionId?: string;
  diagnosis?: string;
  notes?: string;
  language?: "en" | "hi" | string;
  medications?: SavedPrescriptionMedication[];
  isActive?: boolean;
  prescribedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function unmapMedicationToMedicineEntry(
  med: SavedPrescriptionMedication,
): DigitalRxMedicine {
  const dosageParts = (med.dosage || "1-0-0").split("-").map((part) => parseInt(part, 10) || 0);
  const [dosageMorning = 1, dosageAfternoon = 0, dosageNight = 0] = dosageParts;

  let composition = med.composition || "";
  let timing = med.instructions || "";

  if (!composition && timing.includes(";")) {
    const [timingPart, ...compositionParts] = timing.split(";").map((s) => s.trim());
    timing = timingPart;
    composition = compositionParts.join("; ");
  }

  const timingFreqDuration = [timing, med.frequency, med.duration]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" - ");

  return {
    name: med.name,
    type: med.medicineType || "TAB",
    composition,
    dosageMorning,
    dosageAfternoon,
    dosageNight,
    timingFreqDuration,
    quantity: med.quantity ?? 60,
  };
}
