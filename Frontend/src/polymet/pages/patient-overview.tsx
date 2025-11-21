import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ActivityIcon,
  FileTextIcon,
  ClipboardListIcon,
  HeartPulseIcon,
  PillIcon,
  AlertCircleIcon,
  FlaskConicalIcon,
  Loader2Icon,
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  PlusIcon,
  Trash2Icon,
  HistoryIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { LabReportViewerDialog } from "@/polymet/components/lab-report-viewer-dialog";
import { get } from "@/lib/api-client";
import {
  updatePatient,
  PatientUpdateInput,
  MedicationEntry,
  fetchPatientHistory,
  PatientHistoryEntry,
} from "@/lib/api/patients";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  age?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  emergencyContactPhone?: string;
  medicalHistory?: string[] | string;
  allergies?: string[] | string;
  presentInClinic?: boolean;
  chiefComplaint?: string;
  condition?: string;
  lastVisit?: string;
  carePlanSummary?: string;
  followUpPlan?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  insights?: {
    riskAssessment?: string;
    riskLevel?: string;
    successRate?: string;
    keyFindings?: string[];
    recommendations?: string[];
    lastUpdatedAt?: string;
  };
  currentMedications?: MedicationEntry[];
}

interface PatientVitals {
  _id: string;
  patientId: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  recordedAt: string;
  recordedBy?: string;
}

interface LabReport {
  _id: string;
  patientId: string;
  reportType: string;
  testName: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: string;
  orderedAt: string;
  completedAt?: string;
  doctorName?: string;
}

interface ClinicalNote {
  _id: string;
  patientId: string;
  doctorId: string;
  note: string;
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  createdAt: string;
  doctorName?: string;
}

interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
  status: string;
  doctorName?: string;
}

type EditableMedicationEntry = MedicationEntry & {
  _localId: string;
  isNew?: boolean;
};

interface EditPatientFormState {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  emergencyContact: string;
  emergencyContactPhone: string;
  carePlanSummary: string;
  followUpPlan: string;
  condition: string;
  chiefComplaint: string;
  presentInClinic: boolean;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    oxygenSaturation: string;
    weight: string;
  };
  currentMedications: EditableMedicationEntry[];
}

export function PatientOverview() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<PatientVitals[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditPatientFormState>({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "",
    allergies: "",
    medicalHistory: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    carePlanSummary: "",
    followUpPlan: "",
    condition: "",
    chiefComplaint: "",
    presentInClinic: false,
    vitals: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      oxygenSaturation: "",
      weight: "",
    },
    currentMedications: [],
  });

  // Lab report viewer state
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<any>(null);
  const [medicationHistory, setMedicationHistory] = useState<PatientHistoryEntry[]>([]);
  const generateMedId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const createEditableMedication = (
    seed: Partial<MedicationEntry> = {},
    isNew = false
  ): EditableMedicationEntry => ({
    _localId: generateMedId(),
    name: seed.name ?? "",
    dosage: seed.dosage ?? "",
    frequency: seed.frequency ?? "",
    duration: seed.duration ?? "",
    instructions: seed.instructions ?? "",
    startDate: seed.startDate ?? "",
    endDate: seed.endDate ?? "",
    isNew,
  });

  type MedicationSnapshotSegment = { label: string; value: string };

  const formatMedicationSnapshot = (value?: string): MedicationSnapshotSegment[][] => {
    if (!value) return [];
    const labelMap: Record<string, string> = {
      name: "Medicine",
      dosage: "Dosage",
      frequency: "Frequency",
      duration: "Duration",
      instructions: "Instructions",
      startdate: "Start Date",
      enddate: "End Date",
    };

    return value
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) =>
        entry
          .split(",")
          .map((segment) => segment.trim())
          .filter(Boolean)
          .map((segment) => {
            const [rawLabel, ...rest] = segment.split(":");
            const normalizedLabel = rawLabel?.trim().toLowerCase() ?? "";
            const displayLabel =
              labelMap[normalizedLabel] ||
              (rawLabel
                ? rawLabel
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^\w/, (char) => char.toUpperCase())
                : "Detail");
            return {
              label: displayLabel,
              value: rest.join(":").trim() || "—",
            };
          })
      );
  };

  const renderMedicationSnapshot = (
    groups: MedicationSnapshotSegment[][],
    emptyText: string
  ) => {
    if (!groups.length) {
      return <p className="text-xs text-muted-foreground">{emptyText}</p>;
    }

    return (
      <div className="space-y-2">
        {groups.map((segments, groupIndex) => (
          <div
            key={`snapshot-${groupIndex}`}
            className="rounded-md border border-dashed border-border/60 p-2"
          >
            <p className="text-[11px] font-semibold text-muted-foreground mb-1">
              Medication {groupIndex + 1}
            </p>
            <dl className="space-y-1">
              {segments.map((segment, segmentIndex) => (
                <div
                  key={`snapshot-${groupIndex}-${segmentIndex}`}
                  className="flex justify-between gap-2 text-xs"
                >
                  <dt className="text-muted-foreground">{segment.label}:</dt>
                  <dd className="text-foreground">{segment.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    );
  };

  const canEditPatientProfile = useMemo(
    () => (user?.role ? ["doctor", "admin"].includes(user.role) : false),
    [user?.role]
  );

  // Fetch patient data on component mount
  useEffect(() => {
    const fetchPatientDetails = async (id: string): Promise<Patient | null> => {
      // First attempt: /api/patients/{id} (works for MongoDB ObjectIds)
      try {
        const response = await get<{ patient: Patient }>(`/api/patients/${id}`);
        if (response.success && response.data?.patient) {
          return response.data.patient;
        }
      } catch (err) {
        // ignore
      }

      return null;
    };

    const fetchPatientData = async () => {
      if (!patientId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch patient details (supports Mongo _id or friendly ID)
        const patientData = await fetchPatientDetails(patientId);
        if (patientData) {
          setPatient(patientData);
          setHasAnyData(true);
        } else {
          setError("Patient not found");
        }

        // Fetch patient vitals
        const vitalsResponse = await get<{ vitals: PatientVitals[] }>(`/api/patient-vitals/patient/${patientId}`);
        if (vitalsResponse.success && vitalsResponse.data?.vitals) {
          setVitals(vitalsResponse.data.vitals);
          if (vitalsResponse.data.vitals.length > 0) {
            setHasAnyData(true);
          }
        }

        // Fetch lab reports
        const labReportsResponse = await get<{ reports: LabReport[] }>(`/api/lab-reports?patient_id=${patientId}`);
        if (labReportsResponse.success && labReportsResponse.data?.reports) {
          setLabReports(labReportsResponse.data.reports);
          if (labReportsResponse.data.reports.length > 0) {
            setHasAnyData(true);
          }
        }

        // Fetch clinical notes
        const notesResponse = await get<{ notes: ClinicalNote[] }>(`/api/clinical-notes?patient_id=${patientId}`);
        if (notesResponse.success && notesResponse.data?.notes) {
          setClinicalNotes(notesResponse.data.notes);
          if (notesResponse.data.notes.length > 0) {
            setHasAnyData(true);
          }
        }

        // Fetch appointment history
        const appointmentsResponse = await get<{ data: Appointment[] }>(`/api/appointments?patientId=${patientId}`);
        if (appointmentsResponse.success && appointmentsResponse.data?.data) {
          setAppointments(appointmentsResponse.data.data);
          if (appointmentsResponse.data.data.length > 0) {
            setHasAnyData(true);
          }
        }

      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load patient data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!patientId) return;
      try {
        const historyEntries = await fetchPatientHistory(
          patientId,
          "currentMedications",
          50
        );
        setMedicationHistory(historyEntries);
      } catch (err) {
        console.error("Failed to fetch medication history", err);
      }
    };
    loadHistory();
  }, [patientId]);

  const mapPatientToFormState = (patientData: Patient | null): EditPatientFormState => {
    if (!patientData) {
      return {
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        phone: "",
        email: "",
        address: "",
        bloodGroup: "",
        allergies: "",
        medicalHistory: "",
        emergencyContact: "",
        emergencyContactPhone: "",
        carePlanSummary: "",
        followUpPlan: "",
        condition: "",
        chiefComplaint: "",
        presentInClinic: false,
        vitals: {
          bloodPressure: "",
          heartRate: "",
          temperature: "",
          oxygenSaturation: "",
          weight: "",
        },
        currentMedications: [],
      };
    }

    const normalizeTextArray = (value?: string[] | string): string => {
      if (!value) return "";
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value;
    };

    const emergencyContactName =
      typeof patientData.emergencyContact === "object"
        ? patientData.emergencyContact?.name ?? ""
        : (patientData.emergencyContact as unknown as string) ?? "";
    const emergencyContactPhoneValue =
      typeof patientData.emergencyContact === "object"
        ? patientData.emergencyContact?.phone ?? ""
        : patientData.emergencyContactPhone ?? "";

    const vitalsData = patientData.vitals || {};

    return {
      firstName: patientData.firstName ?? "",
      lastName: patientData.lastName ?? "",
      gender: patientData.gender ?? "",
      dateOfBirth: patientData.dateOfBirth
        ? patientData.dateOfBirth.slice(0, 10)
        : "",
      phone: patientData.phone ?? "",
      email: patientData.email ?? "",
      address: patientData.address ?? "",
      bloodGroup: patientData.bloodGroup ?? "",
      allergies: normalizeTextArray(patientData.allergies),
      medicalHistory: normalizeTextArray(patientData.medicalHistory),
      emergencyContact: emergencyContactName,
      emergencyContactPhone: emergencyContactPhoneValue,
      carePlanSummary: patientData.carePlanSummary ?? "",
      followUpPlan: patientData.followUpPlan ?? "",
      condition: patientData.condition ?? "",
      chiefComplaint: patientData.chiefComplaint ?? "",
      presentInClinic: Boolean(patientData.presentInClinic),
      vitals: {
        bloodPressure: vitalsData?.bloodPressure
          ? String(vitalsData.bloodPressure)
          : "",
        heartRate: vitalsData?.heartRate
          ? String(vitalsData.heartRate)
          : "",
        temperature: vitalsData?.temperature
          ? String(vitalsData.temperature)
          : "",
        oxygenSaturation: vitalsData?.oxygenSaturation
          ? String(vitalsData.oxygenSaturation)
          : "",
        weight: vitalsData?.weight ? String(vitalsData.weight) : "",
      },
      currentMedications: (patientData.currentMedications ?? []).map((entry) =>
        createEditableMedication(entry, false)
      ),
    };
  };

  useEffect(() => {
    setEditForm(mapPatientToFormState(patient));
  }, [patient]);

  const calculateAgeFromDob = (date: string) => {
    if (!date) return undefined;
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const sanitizeText = (value?: string) =>
    value && value.trim().length > 0 ? value.trim() : undefined;

  type EditablePatientField =
    | "gender"
    | "phone"
    | "email"
    | "dateOfBirth"
    | "bloodGroup"
    | "address"
    | "allergies"
    | "medicalHistory"
    | "emergencyContact"
    | "emergencyContactPhone"
    | "carePlanSummary"
    | "followUpPlan"
    | "condition"
    | "chiefComplaint";

  const handleCancelEditing = () => {
    if (isSavingProfile) return;
    setEditForm(mapPatientToFormState(patient));
    setProfileError(null);
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (!canEditPatientProfile) return;

    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setProfileError("First and last name are required.");
      return;
    }

    const targetPatientId = patient?._id || patientId;
    if (!targetPatientId) {
      setProfileError("Unable to determine which patient to update.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    const payload: PatientUpdateInput & Record<string, unknown> = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      presentInClinic: editForm.presentInClinic,
    };

    const optionalAssignments: Array<[EditablePatientField, string | undefined]> = [
      ["gender", sanitizeText(editForm.gender)],
      ["phone", sanitizeText(editForm.phone)],
      ["email", sanitizeText(editForm.email)],
      ["dateOfBirth", sanitizeText(editForm.dateOfBirth)],
      ["bloodGroup", sanitizeText(editForm.bloodGroup)],
      ["address", sanitizeText(editForm.address)],
      ["allergies", sanitizeText(editForm.allergies)],
      ["medicalHistory", sanitizeText(editForm.medicalHistory)],
      ["emergencyContact", sanitizeText(editForm.emergencyContact)],
      ["emergencyContactPhone", sanitizeText(editForm.emergencyContactPhone)],
      ["carePlanSummary", sanitizeText(editForm.carePlanSummary)],
      ["followUpPlan", sanitizeText(editForm.followUpPlan)],
      ["condition", sanitizeText(editForm.condition)],
      ["chiefComplaint", sanitizeText(editForm.chiefComplaint)],
    ];

    optionalAssignments.forEach(([field, value]) => {
      if (value !== undefined) {
        payload[field] = value;
      }
    });

    if (payload.dateOfBirth) {
      payload.age = calculateAgeFromDob(payload.dateOfBirth);
    }

    const vitalsPayload: Record<string, string> = {};
    ([
      "bloodPressure",
      "heartRate",
      "temperature",
      "oxygenSaturation",
      "weight",
    ] as const).forEach((key) => {
      const value = editForm.vitals[key];
      if (value && value.trim().length > 0) {
        vitalsPayload[key] = value.trim();
      }
    });
    if (Object.keys(vitalsPayload).length > 0) {
      payload.vitals = vitalsPayload;
    }

    const cleanedMedications = editForm.currentMedications
      .map((entry) => ({
        name: entry.name?.trim() || undefined,
        dosage: entry.dosage?.trim() || undefined,
        frequency: entry.frequency?.trim() || undefined,
        duration: entry.duration?.trim() || undefined,
        instructions: entry.instructions?.trim() || undefined,
        startDate: entry.startDate?.trim() || undefined,
        endDate: entry.endDate?.trim() || undefined,
      }))
      .filter((entry) =>
        Object.values(entry).some((value) => value !== undefined && value !== "")
      );
    payload.currentMedications = cleanedMedications;

    try {
      const updated = await updatePatient(targetPatientId, payload);

      setPatient((prev) => {
        const mergedPatient: Patient = {
          ...(prev ?? displayPatient),
          ...(updated as unknown as Patient),
          fullName:
            (updated as any)?.fullName ??
            `${(updated as any)?.firstName ?? ""} ${(updated as any)?.lastName ?? ""}`.trim(),
        };
        return mergedPatient;
      });

      setEditForm(mapPatientToFormState(updated as unknown as Patient));
      setIsEditMode(false);
      if (patientId) {
        try {
          const historyEntries = await fetchPatientHistory(
            patientId,
            "currentMedications",
            50
          );
          setMedicationHistory(historyEntries);
        } catch (historyError) {
          console.error("Failed to refresh medication history", historyError);
        }
      }
      toast({
        title: "Patient profile updated",
        description: "Changes have been saved successfully.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update patient profile.";
      setProfileError(message);
      toast({
        title: "Unable to save changes",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleMedicationFieldChange = (
    medId: string,
    field: keyof MedicationEntry,
    value: string
  ) => {
    setEditForm((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.map((med) =>
        med._localId === medId ? { ...med, [field]: value } : med
      ),
    }));
  };

  const handleAddMedication = () => {
    setEditForm((prev) => ({
      ...prev,
      currentMedications: [...prev.currentMedications, createEditableMedication({}, true)],
    }));
  };

  const handleRemoveMedication = (medId: string) => {
    setEditForm((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(
        (med) => med._localId !== medId || !med.isNew
      ),
    }));
  };

  const handleViewLabReport = (reportIndex: number) => {
    if (labReports[reportIndex]) {
      setSelectedLabReport(labReports[reportIndex]);
      setLabReportViewerOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Patient Data</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  const displayPatient: Patient = patient ?? {
    _id: patientId ?? "",
    patientId: patientId ?? "",
    firstName: "Unknown",
    lastName: "Patient",
    fullName: "Unknown Patient",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
    age: "",
    presentInClinic: false,
    chiefComplaint: "",
    medicalHistory: [],
    allergies: [],
    condition: "",
    carePlanSummary: "",
    followUpPlan: "",
    insights: {
      riskAssessment: "",
      riskLevel: "medium",
      successRate: "",
      keyFindings: [],
      recommendations: [],
    },
  currentMedications: [],
  };
  const showLimitedDataNotice = !hasAnyData;

  const allergyEntries: string[] = (() => {
    const value = (displayPatient as unknown as Record<string, unknown>).allergies;
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry));
    }
    if (typeof value === "string") {
      return value.trim() ? [value] : [];
    }
    return [];
  })();

  const medicalHistoryEntries: string[] = (() => {
    const value = (displayPatient as unknown as Record<string, unknown>).medicalHistory;
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry));
    }
    if (typeof value === "string") {
      return value.trim() ? [value] : [];
    }
    return [];
  })();

  // Get latest vitals for display - check both patient.vitals and vitals array
  const latestVitals = vitals.length > 0 ? vitals[0] : null;
  const patientVitals = displayPatient.vitals || {};
  
  // Merge vitals from patient object and vitals array (vitals array takes precedence)
  const mergedVitals = {
    bloodPressure: latestVitals?.bloodPressure || patientVitals.bloodPressure,
    heartRate: latestVitals?.heartRate || patientVitals.heartRate,
    temperature: latestVitals?.temperature || patientVitals.temperature,
    oxygenSaturation: latestVitals?.oxygenSaturation || patientVitals.oxygenSaturation,
    weight: latestVitals?.weight || patientVitals.weight,
    height: latestVitals?.height || patientVitals.height,
    bmi: patientVitals.bmi,
  };

  const activeVitals = {
    bloodPressure: isEditMode ? editForm.vitals.bloodPressure : mergedVitals.bloodPressure,
    heartRate: isEditMode ? editForm.vitals.heartRate : mergedVitals.heartRate,
    temperature: isEditMode ? editForm.vitals.temperature : mergedVitals.temperature,
    oxygenSaturation: isEditMode ? editForm.vitals.oxygenSaturation : mergedVitals.oxygenSaturation,
    weight: isEditMode ? editForm.vitals.weight : mergedVitals.weight,
  };

  const savedMedications = editForm.currentMedications.filter((med) => !med.isNew);
  const draftMedications = editForm.currentMedications.filter((med) => med.isNew);
  const currentMedicationsDisplay: EditableMedicationEntry[] = savedMedications;

  // Helper function to get vital status
  const getVitalStatus = (type: string, value: string | number | undefined): { status: string; color: string } => {
    if (!value) return { status: "Not recorded", color: "gray" };
    
    const numValue = typeof value === "string" ? parseFloat(value.split("/")[0] || value) : value;
    
    switch (type) {
      case "bloodPressure":
        const [systolic, diastolic] = String(value).split("/").map(Number);
        if (systolic < 120 && diastolic < 80) return { status: "normal", color: "green" };
        if (systolic < 130 && diastolic < 80) return { status: "elevated", color: "yellow" };
        if (systolic < 140 || diastolic < 90) return { status: "high", color: "orange" };
        return { status: "critical", color: "red" };
      case "heartRate":
        if (numValue >= 60 && numValue <= 100) return { status: "normal", color: "green" };
        if (numValue < 60 || numValue > 100) return { status: "warning", color: "orange" };
        return { status: "normal", color: "green" };
      case "temperature":
        if (numValue >= 97 && numValue <= 99) return { status: "normal", color: "green" };
        if (numValue > 99 && numValue <= 100.4) return { status: "elevated", color: "yellow" };
        if (numValue > 100.4) return { status: "fever", color: "red" };
        return { status: "normal", color: "green" };
      case "oxygenSaturation":
        if (numValue >= 95) return { status: "normal", color: "green" };
        if (numValue >= 90) return { status: "low", color: "orange" };
        return { status: "critical", color: "red" };
      default:
        return { status: "normal", color: "green" };
    }
  };

  // Helper to calculate progress percentage for visual bars
  const getProgressPercentage = (type: string, value: string | number | undefined): number => {
    if (!value) return 0;
    const numValue = typeof value === "string" ? parseFloat(value.split("/")[0] || value) : value;
    
    switch (type) {
      case "bloodPressure":
        return Math.min((numValue / 180) * 100, 100);
      case "heartRate":
        return Math.min(((numValue - 40) / 120) * 100, 100);
      case "temperature":
        return Math.min(((numValue - 95) / 7) * 100, 100);
      case "oxygenSaturation":
        return numValue;
      default:
        return 50;
    }
  };

  return (
    <div className="space-y-6">
      {/* Lab Report Viewer Dialog */}
      <LabReportViewerDialog
        open={labReportViewerOpen}
        onOpenChange={setLabReportViewerOpen}
        reportData={selectedLabReport}
      />


      {showLimitedDataNotice && !error && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="text-sm">
            Basic patient information is displayed. Additional clinical records
            will appear once they are recorded.
          </p>
        </div>
      )}

      {/* Patient Header */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-[#00C4B3]/5 to-[#10b981]/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-[#00C4B3]/20">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayPatient.fullName
                )}&background=random&color=ffffff&size=96`}
                alt={displayPatient.fullName}
              />

              <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-2xl">
                {displayPatient.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {isEditMode ? (
                  <div className="flex flex-col md:flex-row w-full gap-3">
                    <Input
                      placeholder="First name"
                      value={editForm.firstName}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Last name"
                      value={editForm.lastName}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : (
                <h1 className="text-3xl font-bold text-foreground">
                  {displayPatient.fullName}
                </h1>
                )}
                <div className="flex items-center gap-2">
                  {isEditMode ? (
                    <Select
                      value={editForm.presentInClinic ? "in" : "remote"}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({
                          ...prev,
                          presentInClinic: value === "in",
                        }))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Clinic status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">In Clinic</SelectItem>
                        <SelectItem value="remote">Remote Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                <Badge
                  variant="outline"
                  className={
                    displayPatient.presentInClinic
                      ? "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                      : "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                  }
                >
                      {displayPatient.presentInClinic
                        ? "In Clinic"
                        : "Remote Follow-up"}
                </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="w-4 h-4" />

                  <span>ID: {displayPatient.patientId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />

                  {isEditMode ? (
                    <div className="flex flex-col w-full">
                      <Input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            dateOfBirth: event.target.value,
                          }))
                        }
                      />
                      <Select
                        value={editForm.gender || ""}
                        onValueChange={(value) =>
                          setEditForm((prev) => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                  <span>
                    {displayPatient.age || "—"}{" "}
                    {displayPatient.age ? "years" : ""}
                    {displayPatient.gender ? ` • ${displayPatient.gender}` : ""}
                  </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ActivityIcon className="w-4 h-4" />

                  {isEditMode ? (
                    <Select
                      value={editForm.bloodGroup}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, bloodGroup: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                          (group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                  <span>
                    Blood Type: {displayPatient.bloodGroup || "Not recorded"}
                  </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="w-4 h-4" />

                  {isEditMode ? (
                    <Input
                      value={editForm.phone}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                    />
                  ) : (
                  <span>{displayPatient.phone || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="w-4 h-4" />

                  {isEditMode ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                    />
                  ) : (
                  <span>{displayPatient.email || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />

                  <span>
                    Last Visit: {displayPatient.lastVisit || "Not available"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button
                variant="outline"
                className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                View Records
              </Button>
              {canEditPatientProfile && (
                <Button
                  variant="outline"
                  className={
                    isEditMode
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-[#24B173]/30 text-[#24B173] hover:bg-[#24B173]/10"
                  }
                  onClick={() => {
                    setProfileError(null);
                    if (isEditMode) {
                      setEditForm(mapPatientToFormState(patient));
                      setIsEditMode(false);
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  disabled={isSavingProfile}
                >
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  {isEditMode ? "Exit Edit Mode" : "Edit Profile"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="lab-results">Lab Results</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Vital Signs Dashboard */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ActivityIcon className="w-4 h-4 text-[#00C4B3]" />
                  Current Vitals
                </CardTitle>
                <span className="text-[10px] text-muted-foreground">
                  {latestVitals?.recordedAt 
                    ? `Last updated: ${new Date(latestVitals.recordedAt).toLocaleDateString()} ${new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "No recent updates"}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Current Vitals - Primary */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">Primary Vitals</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Blood Pressure */}
                    <div className="p-2.5 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20">
                            <ActivityIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Blood Pressure</p>
                            <p className="text-[10px] text-muted-foreground">
                              {latestVitals?.recordedAt 
                                ? new Date(latestVitals.recordedAt).toLocaleDateString() + " " + new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : "Not recorded"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 space-y-1">
                          {isEditMode ? (
                            <Input
                              placeholder="120/80"
                              value={editForm.vitals.bloodPressure}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    bloodPressure: event.target.value,
                                  },
                                }))
                              }
                            />
                          ) : (
                          <p className="text-base font-semibold text-foreground mb-0.5">
                              {activeVitals.bloodPressure
                                ? `${activeVitals.bloodPressure} mmHg`
                                : "—"}
                          </p>
                          )}
                          {(() => {
                            const status = getVitalStatus(
                              "bloodPressure",
                              activeVitals.bloodPressure
                            );
                            const colorMap: Record<string, string> = {
                              green: "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20",
                              yellow: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
                              orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
                              red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
                              gray: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
                            };
                            return (
                              <Badge className={`text-[10px] px-1.5 py-0 ${colorMap[status.color] || colorMap.gray}`}>
                                {status.status}
                              </Badge>
                            );
                          })()}
                        </div>
                        {!isEditMode && activeVitals.bloodPressure && (
                          <div className="mt-1.5">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all"
                                style={{
                                  width: `${getProgressPercentage(
                                    "bloodPressure",
                                    activeVitals.bloodPressure
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Heart Rate */}
                    <div className="p-2.5 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                            <HeartPulseIcon className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Heart Rate</p>
                            <p className="text-[10px] text-muted-foreground">
                              {latestVitals?.recordedAt 
                                ? new Date(latestVitals.recordedAt).toLocaleDateString() + " " + new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : "Not recorded"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 space-y-1">
                          {isEditMode ? (
                            <Input
                              placeholder="72"
                              value={editForm.vitals.heartRate}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    heartRate: event.target.value,
                                  },
                                }))
                              }
                            />
                          ) : (
                          <p className="text-base font-semibold text-foreground mb-0.5">
                              {activeVitals.heartRate
                                ? `${activeVitals.heartRate} bpm`
                                : "—"}
                          </p>
                          )}
                          {(() => {
                            const status = getVitalStatus(
                              "heartRate",
                              activeVitals.heartRate
                            );
                            const colorMap: Record<string, string> = {
                              green: "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20",
                              yellow: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
                              orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
                              red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
                              gray: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
                            };
                            return (
                              <Badge className={`text-[10px] px-1.5 py-0 ${colorMap[status.color] || colorMap.gray}`}>
                                {status.status}
                              </Badge>
                            );
                          })()}
                        </div>
                        {!isEditMode && activeVitals.heartRate && (
                          <div className="mt-1.5">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-pink-500 transition-all"
                                style={{
                                  width: `${getProgressPercentage(
                                    "heartRate",
                                    activeVitals.heartRate
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="p-2.5 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <ThermometerIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Temperature</p>
                            <p className="text-[10px] text-muted-foreground">
                              {latestVitals?.recordedAt 
                                ? new Date(latestVitals.recordedAt).toLocaleDateString() + " " + new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : "Not recorded"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 space-y-1">
                          {isEditMode ? (
                            <Input
                              placeholder="98.6"
                              value={editForm.vitals.temperature}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    temperature: event.target.value,
                                  },
                                }))
                              }
                            />
                          ) : (
                          <p className="text-base font-semibold text-foreground mb-0.5">
                              {activeVitals.temperature
                                ? `${activeVitals.temperature}°F`
                                : "—"}
                          </p>
                          )}
                          {(() => {
                            const status = getVitalStatus(
                              "temperature",
                              activeVitals.temperature
                            );
                            const colorMap: Record<string, string> = {
                              green: "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20",
                              yellow: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
                              orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
                              red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
                              gray: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
                            };
                            return (
                              <Badge className={`text-[10px] px-1.5 py-0 ${colorMap[status.color] || colorMap.gray}`}>
                                {status.status}
                              </Badge>
                            );
                          })()}
                        </div>
                        {!isEditMode && activeVitals.temperature && (
                          <div className="mt-1.5">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{
                                  width: `${getProgressPercentage(
                                    "temperature",
                                    activeVitals.temperature
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="p-2.5 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                            <ActivityIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Weight</p>
                            <p className="text-[10px] text-muted-foreground">
                              {latestVitals?.recordedAt 
                                ? new Date(latestVitals.recordedAt).toLocaleDateString() + " " + new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : "Not recorded"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 space-y-1">
                          {isEditMode ? (
                            <Input
                              placeholder="165"
                              value={editForm.vitals.weight}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    weight: event.target.value,
                                  },
                                }))
                              }
                            />
                          ) : (
                          <p className="text-base font-semibold text-foreground mb-0.5">
                              {activeVitals.weight ? `${activeVitals.weight} lbs` : "—"}
                            </p>
                          )}
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              activeVitals.weight
                                ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                                : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {activeVitals.weight ? "Recorded" : "Not recorded"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Vitals */}
                <div className="space-y-2 pt-3 border-t">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">Additional Vitals</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Blood Glucose */}
                    <div className="p-2 rounded-lg border border-border bg-card">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                          <DropletIcon className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Blood Glucose</p>
                          <p className="text-xs font-semibold text-foreground">—</p>
                          <Badge className="mt-0.5 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 text-[10px] px-1.5 py-0">
                            Not recorded
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Oxygen Saturation */}
                    <div className="p-2 rounded-lg border border-border bg-card">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20">
                          <ActivityIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Oxygen Saturation</p>
                          {isEditMode ? (
                            <Input
                              className="text-center"
                              value={editForm.vitals.oxygenSaturation}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    oxygenSaturation: event.target.value,
                                  },
                                }))
                              }
                            />
                          ) : (
                          <p className="text-xs font-semibold text-foreground">
                              {activeVitals.oxygenSaturation
                                ? `${activeVitals.oxygenSaturation}%`
                                : "—"}
                          </p>
                          )}
                          {(() => {
                            const status = getVitalStatus(
                              "oxygenSaturation",
                              activeVitals.oxygenSaturation
                            );
                            const colorMap: Record<string, string> = {
                              green: "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20",
                              orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
                              red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
                              gray: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
                            };
                            return (
                              <Badge className={`mt-0.5 text-[10px] px-1.5 py-0 ${colorMap[status.color] || colorMap.gray}`}>
                                {status.status}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Respiratory Rate */}
                    <div className="p-2 rounded-lg border border-border bg-card">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                          <WindIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Respiratory Rate</p>
                          <p className="text-xs font-semibold text-foreground">—</p>
                          <Badge className="mt-0.5 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 text-[10px] px-1.5 py-0">
                            Not recorded
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergies & Conditions */}
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircleIcon className="w-5 h-5 text-[#FF4F6E]" />
                    Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditMode ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={4}
                        placeholder="Peanuts, Penicillin"
                        value={editForm.allergies}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            allergies: event.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple allergies with commas.
                      </p>
                    </div>
                  ) : allergyEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergyEntries.map((allergy, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-[#FF4F6E]/10 text-[#FF4F6E] border-[#FF4F6E]/20"
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No known allergies</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardListIcon className="w-5 h-5 text-[#00C4B3]" />
                    Current Condition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Condition</Label>
                        <Input
                          value={editForm.condition}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              condition: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Care Plan Summary</Label>
                        <Textarea
                          rows={3}
                          value={editForm.carePlanSummary}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              carePlanSummary: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Follow-up Plan</Label>
                        <Textarea
                          rows={3}
                          value={editForm.followUpPlan}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              followUpPlan: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Chief Complaint</Label>
                        <Textarea
                          rows={2}
                          value={editForm.chiefComplaint}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              chiefComplaint: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                  <p className="text-base font-semibold text-foreground">
                    {displayPatient.condition}
                  </p>
                  {displayPatient.carePlanSummary && (
                    <p className="text-sm text-muted-foreground">
                      {displayPatient.carePlanSummary}
                    </p>
                  )}
                  {displayPatient.followUpPlan && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Follow-up:</span>{" "}
                      {displayPatient.followUpPlan}
                    </div>
                  )}
                  {displayPatient.insights?.keyFindings?.length ? (
                    <div className="space-y-1.5 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Key Findings
                      </p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {displayPatient.insights.keyFindings.slice(0, 3).map((finding, idx) => (
                          <li key={`${finding}-${idx}`}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <div className="space-y-2">
                  <Textarea
                    rows={6}
                    value={editForm.medicalHistory}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        medicalHistory: event.target.value,
                      }))
                    }
                    placeholder="Diabetes, Hypertension"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate history entries with commas. Detailed updates are logged automatically.
                  </p>
                </div>
              ) : medicalHistoryEntries.length > 0 ? (
                <div className="space-y-3">
                  {medicalHistoryEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <p className="font-semibold text-foreground">
                        {entry}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardListIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No medical history recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2">
                <PillIcon className="w-5 h-5 text-[#00C4B3]" />
                Active Medications
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? "Existing prescriptions are locked to avoid accidental edits. Add corrections below."
                  : "Current medications on record for this patient."}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentMedicationsDisplay.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PillIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No medications recorded for this patient.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentMedicationsDisplay.map((med) => {
                    const timelineStart = med.startDate
                      ? new Date(med.startDate).toLocaleDateString()
                      : "—";
                    const timelineEnd = med.endDate
                      ? new Date(med.endDate).toLocaleDateString()
                      : "Ongoing";

                    return (
                      <div
                        key={`saved-med-${med._localId}`}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-2 min-w-[160px]">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              Medicine
                            </span>
                            <span className="font-semibold text-foreground">
                              {med.name || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Dosage</span>
                            <span className="font-medium text-foreground">
                              {med.dosage || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Frequency</span>
                            <span className="font-medium text-foreground">
                              {med.frequency || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-medium text-foreground">
                              {med.duration || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Timeline</span>
                            <span className="font-medium text-foreground">
                              {timelineStart} – {timelineEnd}
                            </span>
                          </div>
                        </div>
                        {med.instructions && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Instructions: <span className="text-foreground">{med.instructions}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {isEditMode && (
            <Card className="border-border border-dashed">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-sm font-semibold">Add New Medications</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Use this section to capture newly prescribed medications. You can remove drafts
                  before saving.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {draftMedications.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    No draft medications. Click &quot;Add medication&quot; to add the first entry.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftMedications.map((med) => (
                      <div
                        key={med._localId}
                        className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Medication Name</Label>
                            <Input
                              placeholder="e.g., Metformin"
                              value={med.name}
                              onChange={(event) =>
                                handleMedicationFieldChange(
                                  med._localId,
                                  "name",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => handleRemoveMedication(med._localId)}
                            aria-label="Remove medication draft"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Dosage</Label>
                            <Input
                              placeholder="500 mg"
                              value={med.dosage}
                              onChange={(event) =>
                                handleMedicationFieldChange(
                                  med._localId,
                                  "dosage",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Frequency</Label>
                            <Input
                              placeholder="Twice daily"
                              value={med.frequency}
                              onChange={(event) =>
                                handleMedicationFieldChange(
                                  med._localId,
                                  "frequency",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Duration</Label>
                            <Input
                              placeholder="30 days"
                              value={med.duration}
                              onChange={(event) =>
                                handleMedicationFieldChange(
                                  med._localId,
                                  "duration",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Start Date</Label>
                            <Input
                              type="date"
                              value={med.startDate}
                              onChange={(event) =>
                                handleMedicationFieldChange(
                                  med._localId,
                                  "startDate",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">End Date</Label>
                            <Input
                              type="date"
                              value={med.endDate}
                              onChange={(event) =>
                                handleMedicationFieldChange(
                                  med._localId,
                                  "endDate",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Instructions</Label>
                          <Textarea
                            rows={2}
                            placeholder="Take with meals"
                            value={med.instructions}
                            onChange={(event) =>
                              handleMedicationFieldChange(
                                med._localId,
                                "instructions",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={handleAddMedication}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add medication
                </Button>
              </CardContent>
            </Card>
          )}

          {medicationHistory.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HistoryIcon className="w-4 h-4 text-muted-foreground" />
                  Medication History
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Every update is logged with the user, timestamp, and diff for auditing.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicationHistory.map((entry) => (
                  <div
                    key={entry._id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {entry.updatedBy?.name || entry.updatedBy?.email || "Unknown user"}
                        {entry.updatedBy?.role ? ` (${entry.updatedBy.role})` : ""}
                      </span>
                      <span>{new Date(entry.changedAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-3">
                      {entry.changes.map((change, idx) => {
                        const prevValues = formatMedicationSnapshot(change.oldValue);
                        const newValues = formatMedicationSnapshot(change.newValue);
                        return (
                          <div
                            key={`${entry._id}-${idx}`}
                            className="rounded-md border border-border/60 p-3 space-y-2"
                          >
                            <p className="font-semibold text-sm text-foreground">{change.label}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Previous
                                </p>
                                {renderMedicationSnapshot(
                                  prevValues,
                                  "No medications recorded"
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Updated
                                </p>
                                {renderMedicationSnapshot(newValues, "Cleared")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </TabsContent>

        <TabsContent value="lab-results" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConicalIcon className="w-5 h-5 text-[#00C4B3]" />
                Lab Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Lab reports are managed by the diagnostics workflow. Please use the lab module to add or modify results.
                </div>
              )}
              {labReports.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConicalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                  <p className="text-sm text-muted-foreground">
                    No lab results available for this patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {labReports.map((report, index) => (
                    <div
                      key={report._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {report.testName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {report.reportType}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ordered: {new Date(report.orderedAt).toLocaleDateString()}
                            {report.completedAt && (
                              <> • Completed: {new Date(report.completedAt).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              report.status === "completed"
                                ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                                : report.status === "pending"
                                ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {report.status}
                          </Badge>
                          {report.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                              onClick={() => handleViewLabReport(index)}
                            >
                              <FileTextIcon className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                      {report.status === "completed" && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Result: {report.result} {report.unit}
                              </p>
                              {report.referenceRange && (
                                <p className="text-xs text-muted-foreground">
                                  Reference: {report.referenceRange}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                            >
                              Normal
                            </Badge>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <span>Ordered by: {report.doctorName || "Doctor"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-[#00C4B3]" />
                Clinical Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Clinical notes are captured from consultation sessions. Use the consultation or notes module to edit individual entries.
                </div>
              )}
              {clinicalNotes.length > 0 ? (
                <div className="space-y-4">
                  {clinicalNotes.map((note) => (
                    <div
                      key={note._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {note.diagnosis || "Clinical Note"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()} • {note.doctorName || "Doctor"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                        >
                          Clinical Note
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {note.note}
                          </p>
                        </div>
                        {note.treatment && (
                          <div className="border-l-2 border-[#00C4B3]/30 pl-3">
                            <p className="text-sm font-medium text-foreground mb-1">Treatment Plan:</p>
                            <p className="text-sm text-muted-foreground">{note.treatment}</p>
                          </div>
                        )}
                        {note.followUp && (
                          <div className="border-l-2 border-[#F7B731]/30 pl-3">
                            <p className="text-sm font-medium text-foreground mb-1">Follow-up:</p>
                            <p className="text-sm text-muted-foreground">{note.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No clinical notes found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Appointment timelines are edited from the appointments workspace. Use the scheduling tools to change or cancel visits.
                </div>
              )}
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {appointment.type || "Consultation"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.doctorName || "Doctor"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            appointment.status === "completed"
                              ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                              : appointment.status === "scheduled"
                              ? "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                              : appointment.status === "in-progress"
                              ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground">
                          {appointment.reason}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                        <span>Appointment ID: {appointment.appointmentId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No appointments found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canEditPatientProfile && isEditMode && (
        <div className="sticky bottom-4 z-30">
          <div className="rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {profileError && (
              <p className="mb-2 text-sm text-red-600">{profileError}</p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancelEditing}
                disabled={isSavingProfile}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-[#00C4B3] text-white hover:bg-[#009C8F]"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

