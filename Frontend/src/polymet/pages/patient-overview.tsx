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
  ShieldCheckIcon,
  CreditCardIcon,
  Wallet2Icon,
  IndianRupeeIcon,
  Building2Icon,
  HospitalIcon,
  ClockIcon,
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
import { LabReportViewerDialog, LabReportData } from "@/polymet/components/lab-report-viewer-dialog";
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
  insuranceProvider?: string;
  insuranceNumber?: string;
  insurancePlanName?: string;
  insuranceCoverageLimit?: string;
  insuranceCoverageUsed?: string;
  insuranceNotes?: string;
  insuranceClaims?: Array<{
    claimId?: string;
    amount?: string;
    status?: string;
    description?: string;
    date?: string;
  }>;
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

type LabTestStatus = "normal" | "high" | "low" | "critical" | "pending";

interface LabTest {
  name: string;
  result: string;
  unit?: string;
  normalRange?: string;
  status?: LabTestStatus;
  flag?: string;
}

interface LabReport {
  _id: string;
  reportId?: string;
  patientId: string;
  doctorId: string;
  reportType: string;
  category?: string;
  orderedBy?: string;
  labName?: string;
  collectedDate?: string;
  reportedDate?: string;
  notes?: string;
  interpretation?: string;
  attachments?: string[];
  tests: LabTest[];
  isCritical?: boolean;
  isReviewed?: boolean;
  reviewedBy?: string;
  createdAt?: string;
  updatedAt?: string;
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

type EditableSection = "overview" | "history" | "medications";

interface MedicalHistoryEntryDisplay {
  title: string;
  diagnosis?: string;
  treatedBy?: string;
  recordedOn?: string;
  notes?: string;
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
  const [activeEditSection, setActiveEditSection] = useState<EditableSection | null>(null);
  const [isSavingSection, setIsSavingSection] = useState<EditableSection | null>(null);
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
  const [dirtySections, setDirtySections] = useState<Record<EditableSection, boolean>>({
    overview: false,
    history: false,
    medications: false,
  });
  const markSectionDirty = (section: EditableSection) => {
    setDirtySections((prev) =>
      prev[section] ? prev : { ...prev, [section]: true }
    );
  };

  // Lab report viewer state
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<LabReportData | null>(null);
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
      if (!patientId) {
        setError("Missing patient identifier");
        setPatient(null);
        setHasAnyData(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch patient details (supports Mongo _id or friendly ID)
        const patientData = await fetchPatientDetails(patientId);
        if (patientData) {
          setPatient(patientData);
          setHasAnyData(true);
        } else {
          setError("Patient not found");
        }

        // Fetch patient vitals
        const vitalsResponse = await get<PatientVitals[]>(`/api/patient-vitals/${patientId}?limit=50`);
        if (vitalsResponse.success && Array.isArray(vitalsResponse.data)) {
          setVitals(vitalsResponse.data);
          if (vitalsResponse.data.length > 0) {
            setHasAnyData(true);
          }
        }

        // Fetch lab reports
        const labReportsResponse = await get<LabReport[] | { data: LabReport[] }>(`/api/lab-reports?patientId=${patientId}&limit=50`);
        if (labReportsResponse.success) {
          const reports = Array.isArray(labReportsResponse.data)
            ? labReportsResponse.data
            : Array.isArray((labReportsResponse.data as { data?: LabReport[] })?.data)
            ? (labReportsResponse.data as { data: LabReport[] }).data
            : [];
          setLabReports(reports);
          if (reports.length > 0) {
            setHasAnyData(true);
          }
        }

        // Fetch clinical notes
        const notesResponse = await get<any>(`/api/clinical-notes?patient=${patientId}&limit=25`);
        if (notesResponse.success) {
          const rawNotes = Array.isArray(notesResponse.data)
            ? notesResponse.data
            : Array.isArray((notesResponse.data as any)?.data)
            ? (notesResponse.data as any).data
            : [];
          const transformedNotes: ClinicalNote[] = rawNotes.map((note: any) => ({
            _id: note._id ?? note.id ?? generateTempId(),
            patientId: note.patient ?? note.patientId ?? patientId,
            doctorId: note.doctor ?? note.doctorId ?? "",
            note: note.content ?? note.note ?? "",
            diagnosis: note.title ?? note.diagnosis,
            treatment: note.prescription?.instructions ?? note.treatment,
            followUp: note.follow_up?.notes ?? note.followUp,
            createdAt: note.created_at ?? note.createdAt ?? note.timestamp ?? new Date().toISOString(),
            doctorName: note.doctor_name ?? note.doctorName ?? note.orderedBy ?? "Doctor",
          }));
          setClinicalNotes(transformedNotes);
          if (transformedNotes.length > 0) {
            setHasAnyData(true);
          }
        }

        // Fetch appointment history
        const appointmentsResponse = await get<Appointment[]>(`/api/appointments?patient_id=${patientId}&limit=50`);
        if (appointmentsResponse.success && Array.isArray(appointmentsResponse.data)) {
          setAppointments(appointmentsResponse.data);
          if (appointmentsResponse.data.length > 0) {
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

  const mapPatientToFormState = (
    patientData: Patient | null
  ): EditPatientFormState => {
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
      currentMedications: (patientData.currentMedications || []).map((med) =>
        createEditableMedication(med, false)
      ),
    };
  };

  const isOverviewEditing = activeEditSection === "overview";
  const isHistoryEditing = activeEditSection === "history";
  const isMedicationsEditing = activeEditSection === "medications";

  const beginSectionEditing = (section: EditableSection) => {
    setActiveEditSection(section);
    setDirtySections((prev) => ({ ...prev, [section]: false }));
    setProfileError(null);
  };

  const cancelSectionEditing = (section: EditableSection) => {
    setEditForm(mapPatientToFormState(patient));
    setActiveEditSection((current) => (current === section ? null : current));
    setDirtySections((prev) => ({ ...prev, [section]: false }));
    setProfileError(null);
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

  const buildOverviewPayload = (): (PatientUpdateInput & Record<string, unknown>) | null => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setProfileError("First and last name are required.");
      return null;
    }

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

    return payload;
  };

  const buildHistoryPayload = () => ({
    medicalHistory: editForm.medicalHistory?.trim() ?? "",
  });

  const buildMedicationsPayload = () => {
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

    return { currentMedications: cleanedMedications };
  };

  const handleSaveSection = async (section: EditableSection) => {
    if (!canEditPatientProfile) return;
    if (isSavingSection) return;

    const targetPatientId = patient?._id || patientId;
    if (!targetPatientId) {
      setProfileError("Unable to determine which patient to update.");
      return;
    }

    let payload: (PatientUpdateInput & Record<string, unknown>) | null = null;
    if (section === "overview") {
      payload = buildOverviewPayload();
    } else if (section === "history") {
      payload = buildHistoryPayload();
    } else if (section === "medications") {
      payload = buildMedicationsPayload();
    }

    if (!payload) {
      return;
    }

    setIsSavingSection(section);
    setProfileError(null);

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
      setActiveEditSection(null);
      setDirtySections((prev) => ({ ...prev, [section]: false }));

      if (patientId && section === "medications") {
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

      const sectionLabel =
        section === "overview"
          ? "Overview"
          : section === "history"
          ? "Medical history"
          : "Medications";

      toast({
        title: `${sectionLabel} updated`,
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
      setIsSavingSection(null);
    }
  };

  const handleMedicationFieldChange = (
    medId: string,
    field: keyof MedicationEntry,
    value: string
  ) => {
    markSectionDirty("medications");
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
    markSectionDirty("medications");
  };

  const handleRemoveMedication = (medId: string) => {
    setEditForm((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(
        (med) => med._localId !== medId || !med.isNew
      ),
    }));
    markSectionDirty("medications");
  };

  const handleViewLabReport = (report: LabReport) => {
    const viewerData = mapReportToViewerData(report);
    setSelectedLabReport(viewerData);
    setLabReportViewerOpen(true);
  };

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

  const medicalHistoryEntries: MedicalHistoryEntryDisplay[] = (() => {
    const value = (displayPatient as unknown as Record<string, unknown>).medicalHistory;
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => {
        if (typeof entry === "string") {
          return { title: entry };
        }
        if (entry && typeof entry === "object") {
          const typed = entry as Record<string, string>;
          return {
            title: typed.title || typed.diagnosis || "Medical history",
            diagnosis: typed.diagnosis,
            treatedBy: typed.treatedBy || typed.doctor,
            recordedOn: typed.recordedOn || typed.date,
            notes: typed.notes || typed.description,
          };
        }
        return { title: String(entry) };
      });
    }
    if (typeof value === "string") {
      return value.trim() ? [{ title: value }] : [];
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
    bloodPressure: isOverviewEditing ? editForm.vitals.bloodPressure : mergedVitals.bloodPressure,
    heartRate: isOverviewEditing ? editForm.vitals.heartRate : mergedVitals.heartRate,
    temperature: isOverviewEditing ? editForm.vitals.temperature : mergedVitals.temperature,
    oxygenSaturation: isOverviewEditing ? editForm.vitals.oxygenSaturation : mergedVitals.oxygenSaturation,
    weight: isOverviewEditing ? editForm.vitals.weight : mergedVitals.weight,
  };

  const savedMedications = editForm.currentMedications.filter((med) => !med.isNew);
  const draftMedications = editForm.currentMedications.filter((med) => med.isNew);
  const currentMedicationsDisplay: EditableMedicationEntry[] = savedMedications;
  const activeMedicationsList = currentMedicationsDisplay.filter(
    (med) => !med.endDate
  );
  const pastMedicationsList = currentMedicationsDisplay.filter(
    (med) => Boolean(med.endDate)
  );
const groupedPastMedications = useMemo(() => {
  if (!pastMedicationsList.length) return [];

  const groups = new Map<
    string,
    {
      medications: EditableMedicationEntry[];
      sortKey: number;
    }
  >();

  pastMedicationsList.forEach((med) => {
    const endDate = med.endDate ? new Date(med.endDate) : null;
    const label = endDate
      ? endDate.toLocaleString("en-US", { month: "long", year: "numeric" })
      : "Previous Medications";
    const sortValue = endDate ? endDate.getTime() : 0;

    const existing = groups.get(label);
    if (existing) {
      existing.medications.push(med);
      existing.sortKey = Math.max(existing.sortKey, sortValue);
    } else {
      groups.set(label, {
        medications: [med],
        sortKey: sortValue,
      });
    }
  });

  return Array.from(groups.entries())
    .map(([label, value]) => ({
      label,
      medications: value.medications,
      sortKey: value.sortKey,
    }))
    .sort((a, b) => b.sortKey - a.sortKey);
}, [pastMedicationsList]);

  const groupedLabReports = useMemo(() => {
    if (!labReports.length) return [];
    const groups = new Map<
      string,
      {
        label: string;
        reports: LabReport[];
        sortKey: number;
        totalTests: number;
        abnormalTests: number;
      }
    >();

    labReports.forEach((report) => {
      const referenceDate = report.reportedDate || report.collectedDate || report.updatedAt || report.createdAt;
      const parsedDate = referenceDate ? new Date(referenceDate) : null;
      const label = parsedDate
        ? parsedDate.toLocaleString("en-US", { month: "long", year: "numeric" })
        : "Uncategorized";
      const testCount = report.tests?.length || 0;
      const abnormalCount = report.tests?.filter((test) =>
        ["high", "low", "critical"].includes((test.status || "").toLowerCase())
      ).length || 0;

      const existing = groups.get(label);
      if (existing) {
        existing.reports.push(report);
        existing.totalTests += testCount;
        existing.abnormalTests += abnormalCount;
        if (parsedDate && parsedDate.getTime() > existing.sortKey) {
          existing.sortKey = parsedDate.getTime();
        }
      } else {
        groups.set(label, {
          label,
          reports: [report],
          sortKey: parsedDate ? parsedDate.getTime() : 0,
          totalTests: testCount,
          abnormalTests: abnormalCount,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [labReports]);

  const appointmentBuckets = useMemo(() => {
    if (!appointments.length) {
      return { upcoming: [] as Appointment[], past: [] as Appointment[] };
    }

    const reference = new Date();
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.date);
      const isUpcoming =
        ["scheduled", "checked-in", "in-progress"].includes(
          appointment.status
        ) || appointmentDate.getTime() >= reference.getTime();

      if (isUpcoming) {
        upcoming.push(appointment);
      } else {
        past.push(appointment);
      }
    });

    upcoming.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    past.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return { upcoming, past };
  }, [appointments]);

  const upcomingAppointments = appointmentBuckets.upcoming;
  const pastAppointments = appointmentBuckets.past;

  const insuranceClaims = Array.isArray(displayPatient.insuranceClaims)
    ? displayPatient.insuranceClaims
    : [];

  const insurancePlanName =
    displayPatient.insurancePlanName || displayPatient.insuranceProvider || "Insurance Plan";

  const coverageStats = [
    {
      label: "Provider",
      value: displayPatient.insuranceProvider || "Not provided",
    },
    {
      label: "Policy Number",
      value: displayPatient.insuranceNumber || "Not provided",
    },
    {
      label: "Total Coverage",
      value: displayPatient.insuranceCoverageLimit || "₹—",
    },
    {
      label: "Used",
      value: displayPatient.insuranceCoverageUsed || "₹—",
    },
  ];

  const insuranceBenefits = [
    {
      title: "Hospitalization",
      description: "Covers pre and post hospitalization expenses",
      icon: HospitalIcon,
    },
    {
      title: "Surgical Procedures",
      description: "Broad coverage for major surgical procedures",
      icon: ShieldCheckIcon,
    },
    {
      title: "Medical Examination",
      description: "Diagnostics, pathology, and radiology services",
      icon: ClipboardListIcon,
    },
    {
      title: "Medications",
      description: "Covers medicines and consumables during visit",
      icon: PillIcon,
    },
    {
      title: "Pre-existing Conditions",
      description: "Coverage begins from day one if plan allows",
      icon: HeartPulseIcon,
    },
    {
      title: "Outpatient Services",
      description: "Consultations not covered under standard plan",
      icon: ActivityIcon,
    },
  ];

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

  const generateTempId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const formatDisplayDate = (value?: string, fallback = "Not recorded") => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const normalizeLabTests = (tests: LabTest[] = []): LabReportData["tests"] =>
    tests.map((test) => ({
      name: test.name || "Test Result",
      result: test.result || "—",
      unit: test.unit || "—",
      normalRange: test.normalRange || "—",
      status: (test.status as LabTestStatus) || "pending",
      flag: test.flag,
    }));

  const getLabStatusBadgeClasses = (status?: LabTestStatus) => {
    switch (status) {
      case "normal":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "critical":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const mapReportToViewerData = (report: LabReport): LabReportData => {
    const parsedAge = parseInt(displayPatient.age ?? "", 10);
    return {
      reportId: report.reportId || report._id,
      patientName: displayPatient.fullName,
      patientId: displayPatient.patientId,
      age: Number.isNaN(parsedAge) ? 0 : parsedAge,
      gender: displayPatient.gender || "—",
      reportType: report.reportType,
      category: report.category || "Comprehensive Panel",
      orderedBy: report.orderedBy || report.reviewedBy || report.doctorId || "Attending Physician",
      collectedDate: formatDisplayDate(report.collectedDate),
      reportedDate: formatDisplayDate(report.reportedDate),
      labName: report.labName || "In-house Lab",
      tests: normalizeLabTests(report.tests),
      clinicalNotes: report.notes,
      interpretation: report.interpretation,
    };
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
      {profileError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {profileError}
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
                {isOverviewEditing ? (
                  <div className="flex flex-col md:flex-row w-full gap-3">
                    <Input
                      placeholder="First name"
                      value={editForm.firstName}
                      onChange={(event) => {
                        markSectionDirty("overview");
                        setEditForm((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }));
                      }}
                    />
                    <Input
                      placeholder="Last name"
                      value={editForm.lastName}
                      onChange={(event) => {
                        markSectionDirty("overview");
                        setEditForm((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }));
                      }}
                    />
                  </div>
                ) : (
                <h1 className="text-3xl font-bold text-foreground">
                  {displayPatient.fullName}
                </h1>
                )}
                <div className="flex items-center gap-2">
                  {isOverviewEditing ? (
                    <Select
                      value={editForm.presentInClinic ? "in" : "remote"}
                      onValueChange={(value) => {
                        markSectionDirty("overview");
                        setEditForm((prev) => ({
                          ...prev,
                          presentInClinic: value === "in",
                        }));
                      }}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm leading-relaxed">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="w-4 h-4" />

                  <span>ID: {displayPatient.patientId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />

                  {isOverviewEditing ? (
                    <div className="flex flex-col w-full">
                      <Input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(event) => {
                          markSectionDirty("overview");
                          setEditForm((prev) => ({
                            ...prev,
                            dateOfBirth: event.target.value,
                          }));
                        }}
                      />
                      <Select
                        value={editForm.gender || ""}
                        onValueChange={(value) => {
                          markSectionDirty("overview");
                          setEditForm((prev) => ({ ...prev, gender: value }));
                        }}
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

                  {isOverviewEditing ? (
                    <Select
                      value={editForm.bloodGroup}
                      onValueChange={(value) => {
                        markSectionDirty("overview");
                        setEditForm((prev) => ({ ...prev, bloodGroup: value }));
                      }}
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

                  {isOverviewEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(event) => {
                        markSectionDirty("overview");
                        setEditForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }));
                      }}
                    />
                  ) : (
                  <span>{displayPatient.phone || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="w-4 h-4" />

                  {isOverviewEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(event) => {
                        markSectionDirty("overview");
                        setEditForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }));
                      }}
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

            <div className="flex flex-col gap-2 items-start">
              <Button
                size="sm"
                className="px-4 bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
              {canEditPatientProfile && (
                isOverviewEditing ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => cancelSectionEditing("overview")}
                        disabled={isSavingSection === "overview"}
                      >
                        Cancel Overview Edit
                      </Button>
                      <Button
                        className="bg-[#24B173] hover:bg-[#1A8F58] text-white"
                        onClick={() => handleSaveSection("overview")}
                        disabled={!dirtySections.overview || isSavingSection === "overview"}
                      >
                        {isSavingSection === "overview" ? (
                          <>
                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Overview"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="border-[#24B173]/30 text-[#24B173] hover:bg-[#24B173]/10"
                    onClick={() => beginSectionEditing("overview")}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Edit Overview
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full overflow-x-auto rounded-xl bg-muted/40 p-1 flex flex-wrap gap-1">
          <TabsTrigger value="overview" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Medical History
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Medications
          </TabsTrigger>
          <TabsTrigger value="lab-results" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Lab Results
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Clinical Notes
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="insurance" className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground">
            Insurance
          </TabsTrigger>
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
                          {isOverviewEditing ? (
                            <Input
                              placeholder="120/80"
                              value={editForm.vitals.bloodPressure}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    bloodPressure: event.target.value,
                                  },
                                }));
                              }}
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
                        {!isOverviewEditing && activeVitals.bloodPressure && (
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
                          {isOverviewEditing ? (
                            <Input
                              placeholder="72"
                              value={editForm.vitals.heartRate}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    heartRate: event.target.value,
                                  },
                                }));
                              }}
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
                        {!isOverviewEditing && activeVitals.heartRate && (
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
                          {isOverviewEditing ? (
                            <Input
                              placeholder="98.6"
                              value={editForm.vitals.temperature}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    temperature: event.target.value,
                                  },
                                }));
                              }}
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
                        {!isOverviewEditing && activeVitals.temperature && (
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
                          {isOverviewEditing ? (
                            <Input
                              placeholder="165"
                              value={editForm.vitals.weight}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    weight: event.target.value,
                                  },
                                }));
                              }}
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
                          {isOverviewEditing ? (
                            <Input
                              className="text-center"
                              value={editForm.vitals.oxygenSaturation}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    oxygenSaturation: event.target.value,
                                  },
                                }));
                              }}
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
                  {isOverviewEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={4}
                        placeholder="Peanuts, Penicillin"
                        value={editForm.allergies}
                        onChange={(event) => {
                          markSectionDirty("overview");
                          setEditForm((prev) => ({
                            ...prev,
                            allergies: event.target.value,
                          }));
                        }}
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
                  {isOverviewEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Condition</Label>
                        <Input
                          value={editForm.condition}
                          onChange={(event) => {
                            markSectionDirty("overview");
                            setEditForm((prev) => ({
                              ...prev,
                              condition: event.target.value,
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Care Plan Summary</Label>
                        <Textarea
                          rows={3}
                          value={editForm.carePlanSummary}
                          onChange={(event) => {
                            markSectionDirty("overview");
                            setEditForm((prev) => ({
                              ...prev,
                              carePlanSummary: event.target.value,
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Follow-up Plan</Label>
                        <Textarea
                          rows={3}
                          value={editForm.followUpPlan}
                          onChange={(event) => {
                            markSectionDirty("overview");
                            setEditForm((prev) => ({
                              ...prev,
                              followUpPlan: event.target.value,
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Chief Complaint</Label>
                        <Textarea
                          rows={2}
                          value={editForm.chiefComplaint}
                          onChange={(event) => {
                            markSectionDirty("overview");
                            setEditForm((prev) => ({
                              ...prev,
                              chiefComplaint: event.target.value,
                            }));
                          }}
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

        <TabsContent value="history" className="mt-6">
          <div className="rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-muted/30">
            <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Medical History
                </p>
                <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <ClipboardListIcon className="h-5 w-5 text-[#00C4B3]" />
                  Chronic & acute conditions on record
                </h3>
              </div>
              {canEditPatientProfile && (
                isHistoryEditing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => cancelSectionEditing("history")}
                      disabled={isSavingSection === "history"}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#00C4B3] text-white hover:bg-[#009C8F]"
                      onClick={() => handleSaveSection("history")}
                      disabled={!dirtySections.history || isSavingSection === "history"}
                    >
                      {isSavingSection === "history" ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00C4B3]/40 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                    onClick={() => beginSectionEditing("history")}
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Edit History
                  </Button>
                )
              )}
            </div>

            <div className="px-6 py-5">
              {isHistoryEditing ? (
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    value={editForm.medicalHistory}
                    onChange={(event) => {
                      markSectionDirty("history");
                      setEditForm((prev) => ({
                        ...prev,
                        medicalHistory: event.target.value,
                      }));
                    }}
                    placeholder="Hypertension (diagnosed 2021), Type 2 Diabetes (managed with Metformin)..."
                  />
                  <p className="text-xs text-muted-foreground">
                    List each diagnosis or condition on a new line or separate with commas. Additional clinical notes can be captured from the doctor workstation.
                  </p>
                </div>
              ) : medicalHistoryEntries.length > 0 ? (
                <div className="space-y-4">
                  {medicalHistoryEntries.map((entry, index) => (
                    <div
                      key={`${entry.title}-${index}`}
                      className="rounded-xl border border-border/60 bg-gradient-to-br from-white via-white to-[#F4FFFD] p-5 shadow-sm transition-all hover:border-[#00C4B3]/40 hover:shadow-md dark:from-muted dark:via-muted dark:to-muted/70"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-1 items-start gap-4">
                          <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#00C4B3]/15 text-[#00C4B3]">
                            <ClipboardListIcon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-semibold text-foreground">
                              {entry.title}
                            </h4>
                            {entry.diagnosis && (
                              <p className="text-sm text-muted-foreground">
                                {entry.diagnosis}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground md:items-end">
                          {entry.recordedOn && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {formatDisplayDate(entry.recordedOn, "—")}
                            </span>
                          )}
                          {entry.treatedBy && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-4 w-4" />
                              Treated by {entry.treatedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-12 text-center text-muted-foreground">
                  <ClipboardListIcon className="h-12 w-12 opacity-40" />
                  <p className="mt-3 text-sm font-medium">
                    No medical history recorded for this patient yet.
                  </p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Record diagnoses and chronic conditions during consultation to have them appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PillIcon className="w-5 h-5 text-[#00C4B3]" />
                  Active Medications
                  <span className="inline-flex items-center justify-center rounded-full bg-[#00C4B3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00C4B3]">
                    {activeMedicationsList.length}
                  </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isMedicationsEditing
                    ? "Existing prescriptions are shown below. Use the editor to add corrections."
                    : "Current medications on record for this patient."}
                </p>
              </div>
              {canEditPatientProfile && (
                isMedicationsEditing ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelSectionEditing("medications")}
                      disabled={isSavingSection === "medications"}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#00C4B3] text-white hover:bg-[#009C8F]"
                      onClick={() => handleSaveSection("medications")}
                      disabled={!dirtySections.medications || isSavingSection === "medications"}
                    >
                      {isSavingSection === "medications" ? (
                        <>
                          <Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00C4B3]/30 text-[#00C4B3]"
                    onClick={() => beginSectionEditing("medications")}
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {activeMedicationsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
                  <PillIcon className="h-12 w-12 opacity-40" />
                  <p className="mt-3 text-sm font-medium">
                    No active medications recorded for this patient.
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    When a doctor adds a prescription, it will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {activeMedicationsList.map((med) => {
                      const startDate = med.startDate
                        ? new Date(med.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : null;
                      const durationLabel = med.duration?.trim();
                      const frequencyLabel = med.frequency?.trim();

                      return (
                        <div
                          key={`active-med-${med._localId}`}
                          className="rounded-2xl border border-[#00C4B3]/40 bg-[#00C4B3]/5 p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C4B3]/15 text-[#00C4B3]">
                                <PillIcon className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-base font-semibold text-foreground">
                                  {med.name || "Medication"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {med.dosage || "Dosage not specified"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                            {frequencyLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[#00C4B3]">
                                <ClockIcon className="h-3.5 w-3.5" />
                                {frequencyLabel}
                              </span>
                            )}
                            {startDate && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[#00C4B3]">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {`Since ${startDate}`}
                              </span>
                            )}
                            {durationLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[#00C4B3]">
                                <ClipboardListIcon className="h-3.5 w-3.5" />
                                {durationLabel}
                              </span>
                            )}
                          </div>

                          {med.instructions && (
                            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                              {med.instructions}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {groupedPastMedications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Past Medications
                    </h3>
                    <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {pastMedicationsList.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groupedPastMedications.map((group) => (
                      <div
                        key={`past-med-group-${group.label}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <CalendarIcon className="h-5 w-5 text-[#00C4B3]" />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{group.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.medications.length}{" "}
                            {group.medications.length === 1 ? "medication" : "medications"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isMedicationsEditing && (
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
              {labReports.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConicalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                  <p className="text-sm text-muted-foreground">
                    No lab results available for this patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedLabReports.map((group) => (
                    <div
                      key={group.label}
                      className="rounded-2xl border border-border bg-card/40 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {group.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Laboratory results captured this month
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-muted text-foreground">
                            {group.totalTests} {group.totalTests === 1 ? "test" : "tests"}
                          </Badge>
                          {group.abnormalTests > 0 && (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              {group.abnormalTests} abnormal
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {group.reports.map((report) => (
                          <div
                            key={report._id}
                            className="rounded-lg border border-border/60 bg-background/80 p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {report.reportType}
                                </p>
                                {report.category && (
                                  <p className="text-xs text-muted-foreground">
                                    {report.category}
                                  </p>
                                )}
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Collected: {formatDisplayDate(report.collectedDate)}
                                  {" • "}
                                  Reported: {formatDisplayDate(report.reportedDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    report.isReviewed
                                      ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                                      : "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                                  }
                                >
                                  {report.isReviewed ? "Completed" : "Pending"}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                                  onClick={() => handleViewLabReport(report)}
                                >
                                  <FileTextIcon className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {(report.tests || []).map((test, idx) => (
                                <div
                                  key={`${report._id}-test-${idx}`}
                                  className="rounded-md border border-dashed border-border/60 p-3 space-y-2"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {test.name}
                                      </p>
                                      {test.flag && (
                                        <p className="text-[11px] text-muted-foreground">
                                          {test.flag}
                                        </p>
                                      )}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={getLabStatusBadgeClasses(test.status as LabTestStatus)}
                                    >
                                      {(test.status || "pending").toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div className="bg-muted/30 p-3 rounded">
                                      <p className="text-muted-foreground mb-1">Result</p>
                                      <p className="font-semibold text-foreground">
                                        {test.result || "—"}{" "}
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {test.unit}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded">
                                      <p className="text-muted-foreground mb-1">Normal Range</p>
                                      <p className="font-medium">{test.normalRange || "—"}</p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded">
                                      <p className="text-muted-foreground mb-1">Unit</p>
                                      <p className="font-medium">{test.unit || "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
                              <span>Ordered by: {report.orderedBy || "Physician"}</span>
                              {report.labName && <span>Lab: {report.labName}</span>}
                            </div>
                          </div>
                        ))}
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

        <TabsContent value="appointments" className="space-y-6 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#00C4B3]" />
                Upcoming Appointments
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {upcomingAppointments.length} scheduled
              </Badge>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={`upcoming-${appointment._id}`}
                      className="rounded-xl border border-border/60 bg-card px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {appointment.type || "Consultation"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.doctorName || "Doctor"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(appointment.date).toLocaleDateString()} • {appointment.time}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {appointment.reason && (
                          <Badge variant="outline" className="text-xs">
                            {appointment.reason}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            appointment.status === "completed"
                              ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                              : appointment.status === "scheduled"
                              ? "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                              : "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming appointments</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-muted-foreground" />
                Past Appointments
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {pastAppointments.length} recorded
              </Badge>
            </CardHeader>
            <CardContent>
              {pastAppointments.length > 0 ? (
                <div className="space-y-3">
                  {pastAppointments.map((appointment) => (
                    <div
                      key={`past-${appointment._id}`}
                      className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3"
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {appointment.type || "Consultation"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.doctorName || "Doctor"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(appointment.date).toLocaleDateString()} • {appointment.time}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-muted text-xs text-muted-foreground capitalize">
                            {appointment.status}
                          </Badge>
                          {appointment.reason && (
                            <Badge variant="outline" className="text-xs">
                              {appointment.reason}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HistoryIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No past appointments</p>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="insurance" className="space-y-6 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-[#00C4B3]" />
                Insurance Overview
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Connected insurance profile for this patient. Details are pulled from the patient record.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-r from-[#00C4B3] to-[#0EA47A] text-white p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide opacity-80">
                    {displayPatient.insuranceProvider || "Insurance Provider"}
                  </p>
                  <p className="text-2xl font-semibold">{insurancePlanName}</p>
                  <p className="text-sm opacity-90 mt-1">
                    Member ID: {displayPatient.insuranceNumber || "Not provided"}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <Badge className="bg-white/20 text-white border-white/40">
                    {displayPatient.insuranceProvider ? "Active" : "Not Available"}
                  </Badge>
                  <p className="text-xs opacity-80">
                    Last updated {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {coverageStats.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet2Icon className="w-5 h-5 text-[#00C4B3]" />
                  Coverage Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {insuranceBenefits.map((benefit) => (
                    <div key={benefit.title} className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center gap-2">
                        <benefit.icon className="w-4 h-4 text-[#00C4B3]" />
                        <p className="font-semibold text-sm">{benefit.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-[#00C4B3]" />
                  Claims History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insuranceClaims.length > 0 ? (
                  <div className="space-y-3">
                    {insuranceClaims.map((claim, index) => (
                      <div key={claim.claimId || index} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">
                              Claim {claim.claimId || `#${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {claim.date
                                ? new Date(claim.date).toLocaleDateString()
                                : "Date not available"}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              claim.status === "Approved"
                                ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                                : claim.status === "Pending"
                                ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {claim.status || "Unknown"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {claim.description || "No description provided"}
                        </p>
                        {claim.amount && (
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            Amount: {claim.amount}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No claims recorded for this patient.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupeeIcon className="w-5 h-5 text-[#00C4B3]" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {displayPatient.insuranceNotes ||
                  "Insurance verification is handled by the receptionist team. Please ensure policy details are up to date before processing claims."}
              </p>
              <p className="text-xs text-muted-foreground">
                For assistance, contact the insurance desk or email{" "}
                <a
                  href="mailto:support@alertedai.care"
                  className="text-[#00C4B3] underline"
                >
                  support@alertedai.care
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

