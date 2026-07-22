import { useState, useEffect, useMemo, useCallback, FormEvent, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  HospitalIcon,
  UsersIcon,
  EditIcon,
  SparklesIcon,
  CheckCircleIcon,
  SearchIcon,
  Clock3Icon,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { LabReportViewerDialog, LabReportData } from "@/polymet/components/lab-report-viewer-dialog";
import { S3ReportViewerDialog } from "@/polymet/components/s3-report-viewer-dialog";
import { AppointmentDetailsDialog } from "@/polymet/components/appointment-details-dialog";
import { get, post } from "@/lib/api-client";
import {
  updatePatient,
  PatientUpdateInput,
  MedicationEntry,
  MedicalHistoryRecord,
} from "@/lib/api/patients";
import {
  fetchPatientInsurances,
  createPatientInsurance,
  updatePatientInsurance,
  deletePatientInsurance,
  PatientInsuranceRecord,
  PatientInsurancePayload,
} from "@/lib/api/patient-insurance";
import {
  fetchInsuranceCoverage,
  createInsuranceCoverage,
  updateInsuranceCoverage,
  type InsuranceCoverage,
} from "@/lib/api/insurance-coverage";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  medieaseClinicEmail?: string;
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
  medicalHistory?: Array<string | MedicalHistoryRecord> | string;
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
    bloodGlucose?: string;
    respiratoryRate?: string;
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
  insuranceValidFrom?: string;
  insuranceValidUntil?: string;
  insuranceFamilyMembersCovered?: number | string;
  insuranceStatus?: string;
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
  bloodGlucose?: number;
  respiratoryRate?: number;
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
  appointmentId?: string;
  note: string;
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  createdAt: string;
  doctorName?: string;
}

interface ParsedLabTestRow {
  name?: string;
  result?: string;
  unit?: string;
  normalRange?: string;
  status?: string;
  flag?: string;
}

interface ParsedLabReportPayload {
  reportType?: string;
  labName?: string;
  collectedDate?: string;
  reportedDate?: string;
  interpretation?: string;
  notes?: string;
  tests?: ParsedLabTestRow[];
  summaryText?: string;
}

interface S3Report {
  _id: string;
  patientId: string;
  patientMongoId: string;
  patientEmail: string;
  documentName: string;
  s3Key: string;
  s3Url: string;
  presignedUrl?: string;
  createdAt: string;
  updatedAt: string;
  parseStatus?: "pending" | "processing" | "success" | "failed";
  parseError?: string | null;
  parsedAt?: string;
  parsedLabReport?: ParsedLabReportPayload | null;
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
  patientName?: string;
  createdAt?: string;
  created_at?: string;
  prescription?: string;
  prescriptionMedications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  prescriptionFileUrl?: string;
  prescriptionFileName?: string;
  prescriptionFileKey?: string;
  tests?: string;
  prescribedTest?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  detailedNotes?: string;
  transcription?: string;
  consultationNotes?: string;
  structuredNotes?: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    reviewOfSystems?: string;
    physicalExamination?: string;
    assessment?: string;
    plan?: string;
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }>;
    allergies?: string[];
    followUpInstructions?: string;
    differentialDiagnosis?: string[];
    clinicalImpression?: string;
  };
  consultationSummary?: {
    chiefComplaint?: string;
    assessment?: string;
    plan?: string;
  };
  aiRecommendations?: string | {
    riskAssessment?: {
      level?: string;
      successRate?: string;
      similarCases?: number;
    };
    keyFindings?: string[];
    recommendations?: string[];
  };
  clinicalNotes?: ClinicalNote[];
  // Patient profile updates tracking from this appointment
  patientProfileUpdates?: {
    fieldsUpdated?: string[];
    medicationsAdded?: Array<{name: string; dosage?: string; duration?: string}>;
    allergiesAdded?: string[];
    chiefComplaintAdded?: string;
    assessmentAdded?: string;
    planAdded?: string;
    followUpAdded?: string;
    historyOfPresentIllnessAdded?: string;
    lastVisitUpdated?: string;
    timestamp?: string;
  };
}

type EditableMedicationEntry = MedicationEntry & {
  _localId: string;
  isNew?: boolean;
};

type EditableMedicalHistoryEntry = MedicalHistoryRecord & {
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
    bloodGlucose: string;
    respiratoryRate: string;
    height: string;
  };
  currentMedications: EditableMedicationEntry[];
  medicalHistoryEntries: EditableMedicalHistoryEntry[];
  familyHistory: string;
  previousSurgeries: string;
  familyHistoryEntries: {
    _localId: string;
    relation: string;
    condition: string;
    notes: string;
  }[];
  previousSurgeryEntries: {
    _localId: string;
    surgery: string;
    date: string;
    hospital: string;
    notes: string;
  }[];
}

type EditableSection = "overview" | "history" | "medications";

interface MedicalHistoryEntryDisplay {
  title: string;
  diagnosis?: string;
  treatedBy?: string;
  recordedOn?: string;
  notes?: string;
}

interface InsuranceFormState {
  provider: string;
  planName: string;
  policyNumber: string;
  cardNumber: string;
  memberName: string;
  status: string;
  coverageLimit: string;
  coverageUsed: string;
  coverageRemaining: string;
  validFrom: string;
  validUntil: string;
  familyMembersCovered: string;
  notes: string;
  isPrimary: boolean;
}

const defaultInsuranceFormState: InsuranceFormState = {
  provider: "",
  planName: "",
  policyNumber: "",
  cardNumber: "",
  memberName: "",
  status: "Active",
  coverageLimit: "",
  coverageUsed: "",
  coverageRemaining: "",
  validFrom: "",
  validUntil: "",
  familyMembersCovered: "",
  notes: "",
  isPrimary: false,
};

// Helper function to extract list from various response formats
const extractList = <T,>(rawData: any): T[] => {
  if (Array.isArray(rawData)) {
    return rawData as T[];
  }
  if (rawData && Array.isArray(rawData.data)) {
    return rawData.data as T[];
  }
  if (rawData && Array.isArray(rawData.items)) {
    return rawData.items as T[];
  }
  if (rawData && Array.isArray(rawData.results)) {
    return rawData.results as T[];
  }
  if (rawData && Array.isArray(rawData.appointments)) {
    return rawData.appointments as T[];
  }
  return [];
};

export function PatientOverview() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // HIPAA access gate: only doctors with an active consultation (queueId=in-consultation) can view this page
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);

  const queueId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("queueId") || "";
  }, [location.search]);

  const appointmentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("appointmentId") || "";
  }, [location.search]);

  const isEmbedded = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("embedded") === "1";
  }, [location.search]);

  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("returnTo") || "";
    // Safety: only allow navigating back to an internal consultation route.
    return raw.startsWith("/consultation/") ? raw : "";
  }, [location.search]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<PatientVitals[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [s3Reports, setS3Reports] = useState<S3Report[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
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
      bloodGlucose: "",
      respiratoryRate: "",
      height: "",
    },
    currentMedications: [],
  medicalHistoryEntries: [],
    familyHistory: "",
    previousSurgeries: "",
    familyHistoryEntries: [],
    previousSurgeryEntries: [],
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user || user.role !== "doctor") {
          setAccessAllowed(false);
          return;
        }

        if (!queueId) {
          setAccessAllowed(false);
          return;
        }

        const response = await get<any>(`/api/queue/${queueId}`);
        const payload = (response as any)?.data?.data ?? (response as any)?.data;
        const doctorId = payload?.doctor?._id ?? payload?.doctor;
        const status = String(payload?.status ?? "").toLowerCase();

        const isDoctorMatch = doctorId && String(doctorId) === String(user._id);
        const isActiveConsultation = status === "in-consultation";

        setAccessAllowed(Boolean(isDoctorMatch && isActiveConsultation));
      } catch (err) {
        console.warn("Patient overview access check failed:", err);
        setAccessAllowed(false);
      } finally {
        setAccessChecking(false);
      }
    };

    void checkAccess();
  }, [queueId, user]);
  const [dirtySections, setDirtySections] = useState<Record<EditableSection, boolean>>({
    overview: false,
    history: false,
    medications: false,
  });
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [lastVisitDisplay, setLastVisitDisplay] = useState<string | null>(null);
  const [lastVisitCondition, setLastVisitCondition] = useState<string | null>(null);
  const markSectionDirty = (section: EditableSection) => {
    setDirtySections((prev) =>
      prev[section] ? prev : { ...prev, [section]: true }
    );
  };
  const resetDirtySections = () =>
    setDirtySections({
      overview: false,
      history: false,
      medications: false,
    });
  const hasUnsavedChanges =
    dirtySections.overview || dirtySections.history || dirtySections.medications;

  // Lab report viewer state
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<LabReportData | null>(null);
  // S3 report viewer state
  const [s3ReportViewerOpen, setS3ReportViewerOpen] = useState(false);
  const [selectedS3Report, setSelectedS3Report] = useState<S3Report | null>(null);
  const labUploadInputRef = useRef<HTMLInputElement>(null);
  const medicationHistoryRef = useRef<HTMLDivElement>(null);
  const [labUploadLoading, setLabUploadLoading] = useState(false);
  const [medicationSearch, setMedicationSearch] = useState("");
  const [insuranceRecords, setInsuranceRecords] = useState<PatientInsuranceRecord[]>([]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string | null>(null);
  const [isInsuranceDialogOpen, setIsInsuranceDialogOpen] = useState(false);
  const [insuranceDialogMode, setInsuranceDialogMode] = useState<"create" | "edit">("create");
  const [insuranceForm, setInsuranceForm] = useState<InsuranceFormState>(defaultInsuranceFormState);
  const [isSavingInsurance, setIsSavingInsurance] = useState(false);
  const [deletingInsuranceId, setDeletingInsuranceId] = useState<string | null>(null);
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [selectedBenefits, setSelectedBenefits] = useState<Set<string>>(
    new Set([
      "Hospitalization",
      "Surgical Procedures",
      "Medical Examination",
      "Medications",
      "Pre-existing Conditions",
      "Outpatient Services",
    ])
  );
  const [isBenefitsDialogOpen, setIsBenefitsDialogOpen] = useState(false);
  const [insuranceFormBenefits, setInsuranceFormBenefits] = useState<Set<string>>(
    new Set([
      "Hospitalization",
      "Surgical Procedures",
      "Medical Examination",
      "Medications",
      "Pre-existing Conditions",
      "Outpatient Services",
    ])
  );
  const generateMedId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // --- Last visit logic (reused from doctor workstation) ---
  useEffect(() => {
    const fetchLastVisit = async () => {
      const targetPatientId = patient?._id || patientId;
      if (!targetPatientId) {
        setLastVisitDisplay(null);
        setLastVisitCondition(null);
        return;
      }

      try {
        const response = await get<any>(
          `/api/appointments?patient_id=${targetPatientId}&limit=50`
        );
        if (!response.success) {
          setLastVisitDisplay(null);
          setLastVisitCondition(null);
          return;
        }

        const rawAppointments = extractList<any>(response.data);
        if (!rawAppointments.length) {
          setLastVisitDisplay(null);
          setLastVisitCondition(null);
          return;
        }

        const todayDateOnly = new Date();
        todayDateOnly.setHours(0, 0, 0, 0);
        const todayTime = todayDateOnly.getTime();

        const pastAppointments = rawAppointments.filter((apt) => {
          const dateString =
            apt.date || apt.createdAt || apt.created_at || apt.timestamp;
          if (!dateString) return false;
          const time = new Date(dateString).getTime();
          return !isNaN(time) && time < todayTime;
        });

        if (!pastAppointments.length) {
          setLastVisitDisplay(null);
          setLastVisitCondition(null);
          return;
        }

        const latest = pastAppointments.reduce<any | null>((currentLatest, apt) => {
          const dateString =
            apt.date || apt.createdAt || apt.created_at || apt.timestamp;
          if (!dateString) return currentLatest;
          const time = new Date(dateString).getTime();
          if (!currentLatest) {
            return { time, apt };
          }
          return time > currentLatest.time ? { time, apt } : currentLatest;
        }, null);

        if (latest && latest.apt) {
          const consultationSummary =
            (latest.apt.consultationSummary as Record<string, unknown>) || {};
          const structuredNotes =
            (latest.apt.structuredNotes as Record<string, unknown>) || {};
          const conditionText = [
            consultationSummary.assessment,
            structuredNotes.assessment,
            structuredNotes.clinicalImpression,
            consultationSummary.clinicalImpression,
            latest.apt.diagnosis,
          ]
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .find(Boolean);
          setLastVisitCondition(conditionText || null);

          const latestDateString =
            latest.apt.date ||
            latest.apt.createdAt ||
            latest.apt.created_at ||
            latest.apt.timestamp;

          if (latestDateString) {
            const formattedDate = new Date(latestDateString).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "2-digit",
              }
            );
            setLastVisitDisplay(formattedDate);
            return;
          }
        }

        setLastVisitDisplay(null);
        setLastVisitCondition(null);
      } catch (err) {
        console.warn("Failed to fetch last visit for patient", targetPatientId, err);
        setLastVisitDisplay(null);
        setLastVisitCondition(null);
      }
    };

    fetchLastVisit();
  }, [patient?._id, patientId]);

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

  const generateHistoryEntryId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const createEditableHistoryEntry = (
    seed: Partial<MedicalHistoryRecord> = {},
    isNew = false
  ): EditableMedicalHistoryEntry => ({
    _localId: generateHistoryEntryId(),
    title: seed.title ?? "",
    diagnosis: seed.diagnosis ?? "",
    treatedBy: seed.treatedBy ?? "",
    recordedOn: seed.recordedOn ?? "",
    notes: seed.notes ?? "",
    isNew,
  });

  const isValidObjectId = (value?: string) => Boolean(value && /^[a-fA-F0-9]{24}$/.test(value));

  const resolvedInsurancePatientId = useMemo(() => {
    if (patient?._id) {
      return patient._id;
    }
    if (isValidObjectId(patientId)) {
      return patientId;
    }
    return null;
  }, [patient?._id, patientId]);

  const loadPatientInsurances = useCallback(async () => {
    if (!resolvedInsurancePatientId) {
      console.log("loadPatientInsurances: No resolved patient ID yet");
      return;
    }
    try {
      console.log("loadPatientInsurances: Fetching for patient ID:", resolvedInsurancePatientId);
      const records = await fetchPatientInsurances(resolvedInsurancePatientId);
      console.log("loadPatientInsurances: Received records:", records);
      setInsuranceRecords(records);
      if (records.length) {
        setHasAnyData(true);
        console.log("loadPatientInsurances: Set", records.length, "insurance records");
      } else {
        console.log("loadPatientInsurances: No insurance records found");
      }
    } catch (err) {
      console.error("Failed to load insurance records", err);
    }
  }, [resolvedInsurancePatientId]);

  const formatInsuranceCardNumber = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const buildDefaultInsuranceForm = () => ({
    ...defaultInsuranceFormState,
    memberName: patient?.fullName || "",
    isPrimary: !insuranceRecords.length,
  });

  const handleInsuranceFieldChange = (field: keyof InsuranceFormState, value: string | boolean) => {
    setInsuranceForm((prev) => ({
      ...prev,
      [field]:
        typeof value === "string" && field === "cardNumber"
          ? formatInsuranceCardNumber(value)
          : value,
    }));
  };

  const openInsuranceDialog = async (mode: "create" | "edit", record?: PatientInsuranceRecord) => {
    setInsuranceDialogMode(mode);
    if (mode === "edit" && record) {
      setInsuranceForm({
        provider: record.provider || "",
        planName: record.planName || "",
        policyNumber: record.policyNumber || "",
        cardNumber: record.cardNumber || "",
        memberName: record.memberName || patient?.fullName || "",
        status: record.status || "Active",
        coverageLimit: record.coverageLimit || "",
        coverageUsed: record.coverageUsed || "",
        coverageRemaining: record.coverageRemaining || "",
        validFrom: record.validFrom || "",
        validUntil: record.validUntil || "",
        familyMembersCovered:
          record.familyMembersCovered !== undefined && record.familyMembersCovered !== null
            ? String(record.familyMembersCovered)
            : "",
        notes: record.notes || "",
        isPrimary: Boolean(record.isPrimary),
      });
      setEditingInsuranceId(record._id);
      setSelectedInsuranceId(record._id);
      
      // Load existing coverage benefits for this policy
      if (record.policyNumber || record.cardNumber) {
        const policyNumber = record.policyNumber || record.cardNumber;
        if (resolvedInsurancePatientId && policyNumber) {
          try {
            const coverage = await fetchInsuranceCoverage(resolvedInsurancePatientId, policyNumber);
            if (coverage && !Array.isArray(coverage) && coverage.selectedBenefits) {
              setInsuranceFormBenefits(new Set(coverage.selectedBenefits));
            } else if (Array.isArray(coverage) && coverage.length > 0) {
              setInsuranceFormBenefits(new Set(coverage[0].selectedBenefits || []));
            } else {
              // Reset to defaults if no coverage found
              setInsuranceFormBenefits(
                new Set([
                  "Hospitalization",
                  "Surgical Procedures",
                  "Medical Examination",
                  "Medications",
                  "Pre-existing Conditions",
                  "Outpatient Services",
                ])
              );
            }
          } catch (err) {
            // If no coverage found, use defaults
            setInsuranceFormBenefits(
              new Set([
                "Hospitalization",
                "Surgical Procedures",
                "Medical Examination",
                "Medications",
                "Pre-existing Conditions",
                "Outpatient Services",
              ])
            );
          }
        }
      }
    } else {
      setInsuranceForm(buildDefaultInsuranceForm());
      setEditingInsuranceId(null);
      // Reset to defaults for new insurance
      setInsuranceFormBenefits(
        new Set([
          "Hospitalization",
          "Surgical Procedures",
          "Medical Examination",
          "Medications",
          "Pre-existing Conditions",
          "Outpatient Services",
        ])
      );
    }
    setIsInsuranceDialogOpen(true);
  };

  const closeInsuranceDialog = () => {
    setIsInsuranceDialogOpen(false);
    setInsuranceForm(buildDefaultInsuranceForm());
    setEditingInsuranceId(null);
    setInsuranceFormBenefits(
      new Set([
        "Hospitalization",
        "Surgical Procedures",
        "Medical Examination",
        "Medications",
        "Pre-existing Conditions",
        "Outpatient Services",
      ])
    );
  };

  const buildInsurancePayload = (): PatientInsurancePayload => {
    const payload: PatientInsurancePayload = {};

    const assignString = (key: keyof InsuranceFormState) => {
      const value = insuranceForm[key];
      if (typeof value === "string" && value.trim().length > 0) {
        (payload as Record<string, string>)[key] = value.trim();
      }
    };

    assignString("provider");
    assignString("planName");
    assignString("policyNumber");
    assignString("cardNumber");
    assignString("memberName");
    assignString("status");
    assignString("coverageLimit");
    assignString("coverageUsed");
    assignString("coverageRemaining");
    assignString("validFrom");
    assignString("validUntil");
    assignString("notes");

    if (insuranceForm.familyMembersCovered.trim().length > 0) {
      const parsed = Number(insuranceForm.familyMembersCovered);
      payload.familyMembersCovered = Number.isNaN(parsed)
        ? insuranceForm.familyMembersCovered.trim()
        : parsed;
    }

    payload.isPrimary = insuranceForm.isPrimary;

    // Include selected benefits
    if (selectedBenefits.size > 0) {
      payload.selectedBenefits = Array.from(selectedBenefits);
    }

    return payload;
  };

  const handleInsuranceFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resolvedInsurancePatientId) {
      toast({
        variant: "destructive",
        title: "Patient data loading",
        description: "Please wait for patient details before managing insurance.",
      });
      return;
    }
    if (!insuranceForm.provider.trim()) {
      toast({
        variant: "destructive",
        title: "Provider is required",
        description: "Please enter the insurance provider name.",
      });
      return;
    }
    setIsSavingInsurance(true);
    try {
      const payload = buildInsurancePayload();
      
      if (insuranceDialogMode === "create") {
        await createPatientInsurance({
          ...payload,
          patientId: resolvedInsurancePatientId,
        });
        toast({ title: "Insurance added" });
      } else if (editingInsuranceId) {
        await updatePatientInsurance(editingInsuranceId, payload);
        toast({ title: "Insurance updated" });
      }
      
      // Save/update coverage benefits using policy number from form
      const policyNumber = insuranceForm.policyNumber || insuranceForm.cardNumber;
      if (policyNumber && insuranceFormBenefits.size > 0) {
        try {
          const benefitsArray = Array.from(insuranceFormBenefits);
          
          // Try to fetch existing coverage
          let existingCoverage: InsuranceCoverage | null = null;
          try {
            const coverage = await fetchInsuranceCoverage(resolvedInsurancePatientId, policyNumber);
            existingCoverage = Array.isArray(coverage) ? coverage[0] : coverage;
          } catch (err) {
            // Coverage doesn't exist yet, will create new
          }

          if (existingCoverage?._id) {
            // Update existing coverage
            await updateInsuranceCoverage(existingCoverage._id, {
              selectedBenefits: benefitsArray,
            });
          } else {
            // Create new coverage
            await createInsuranceCoverage({
              patientId: resolvedInsurancePatientId,
              policyNumber,
              selectedBenefits: benefitsArray,
            });
          }
        } catch (err) {
          console.error("Failed to save coverage benefits:", err);
          // Don't fail the whole operation if coverage save fails
          toast({
            variant: "default",
            title: "Insurance saved",
            description: "Coverage benefits could not be saved. You can update them later.",
          });
        }
      }
      
      await loadPatientInsurances();
      closeInsuranceDialog();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Insurance save failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSavingInsurance(false);
    }
  };

  const handleDeleteInsurance = async (recordId: string) => {
    if (!window.confirm("Delete this insurance record?")) {
      return;
    }
    try {
      setDeletingInsuranceId(recordId);
      await deletePatientInsurance(recordId);
      toast({ title: "Insurance deleted" });
      await loadPatientInsurances();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete insurance",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDeletingInsuranceId(null);
    }
  };

  useEffect(() => {
    loadPatientInsurances();
  }, [loadPatientInsurances]);

  const canEditPatientProfile = useMemo(
    () => (user?.role ? ["doctor", "admin"].includes(user.role) : false),
    [user?.role]
  );

  // Fetch patient data on component mount
  useEffect(() => {
    const fetchPatientDetails = async (id: string): Promise<Patient | null> => {
      // Build query params with appointment_id if available
      const queryParams = new URLSearchParams();
      if (appointmentId) {
        queryParams.set("appointment_id", appointmentId);
      }
      const queryString = queryParams.toString();
      const urlSuffix = queryString ? `?${queryString}` : "";

      // First attempt: /api/patients/{id} (works for MongoDB ObjectIds)
      try {
        const response = await get<{ patient: Patient }>(`/api/patients/${id}${urlSuffix}`);
        if (response.success && response.data?.patient) {
          return response.data.patient;
        }
      } catch (err) {
        // ignore and try alternative endpoint
      }

      // Second attempt: /api/patients/patient-id/{id} (works for patient IDs like P001)
      try {
        const response = await get<{ patient: Patient }>(`/api/patients/patient-id/${id}${urlSuffix}`);
        if (response.success && response.data?.patient) {
          return response.data.patient;
        }
      } catch (err) {
        // ignore
      }

      return null;
    };

    const fetchPatientData = async () => {
      if (accessChecking) {
        return;
      }
      if (!accessAllowed) {
        setError("Access restricted: Patient details are only available during an active consultation.");
        setPatient(null);
        setHasAnyData(false);
        setIsLoading(false);
        return;
      }
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
        // Check sessionStorage cache first for faster re-navigation
        const cacheKey = `patient_${patientId}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheAge = Date.now() - (parsed.timestamp || 0);
            // Use cache if less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              setPatient(parsed.data);
              setHasAnyData(true);
              setIsLoading(false);
              // Still fetch fresh data in background
            }
          } catch (e) {
            // Invalid cache, continue with fetch
          }
        }

        // Fetch patient details (supports Mongo _id or friendly ID)
        const patientData = await fetchPatientDetails(patientId);
        if (patientData) {
          setPatient(patientData);
          setHasAnyData(true);
          // Cache patient data for faster re-navigation
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: patientData,
              timestamp: Date.now()
            }));
          } catch (e) {
            // Ignore cache errors
          }
          // Set loading to false immediately after patient data is loaded
          setIsLoading(false);
        } else {
          setError("Patient not found");
          setIsLoading(false);
          return;
        }

        // Use MongoDB ObjectId for S3 reports when available
        const targetPatientId = patientData?._id || patientId;

        // Fetch related data in background (non-blocking)
        const fetchRelatedData = async () => {
          const tasks: Promise<void>[] = [];

        // Patient vitals (reduced initial limit for faster loading)
        tasks.push(
          (async () => {
            try {
              const vitalsResponse = await get<PatientVitals[]>(
                `/api/patient-vitals/${patientId}?limit=10`
              );
              if (vitalsResponse.success && Array.isArray(vitalsResponse.data)) {
                setVitals(vitalsResponse.data);
                if (vitalsResponse.data.length > 0) {
                  setHasAnyData(true);
                }
              }
            } catch (vitalsError) {
              console.warn("Failed to fetch vitals:", vitalsError);
            }
          })()
        );

        // Lab reports (reduced initial limit for faster loading)
        tasks.push(
          (async () => {
            try {
              const labReportsResponse = await get<LabReport[] | { data: LabReport[] }>(
                `/api/lab-reports?patientId=${patientId}&limit=10`
              );
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
            } catch (labError) {
              console.warn("Failed to fetch lab reports:", labError);
            }
          })()
        );

        // S3 reports (complete patient history)
        tasks.push(
          (async () => {
            try {
              if (!targetPatientId) return;
              const s3ReportsResponse = await get<{ reports: S3Report[]; count: number }>(
                `/api/s3-reports/patient/${targetPatientId}`
              );
              if (s3ReportsResponse.success && s3ReportsResponse.data?.reports) {
                const sortedReports = s3ReportsResponse.data.reports
                  .sort((a, b) => {
                    const dateA = new Date(
                      a.parsedLabReport?.reportedDate ||
                        a.parsedLabReport?.collectedDate ||
                        a.createdAt,
                    ).getTime();
                    const dateB = new Date(
                      b.parsedLabReport?.reportedDate ||
                        b.parsedLabReport?.collectedDate ||
                        b.createdAt,
                    ).getTime();
                    return dateB - dateA;
                  });
                setS3Reports(sortedReports);
                if (sortedReports.length > 0) {
                  setHasAnyData(true);
                }
              }
            } catch (s3Error) {
              console.warn("Failed to fetch S3 reports:", s3Error);
            }
          })()
        );

        // Clinical notes for this patient
        tasks.push(
          (async () => {
            try {
              const notesResponse = await get<any>(
                `/api/clinical-notes?patient=${patientId}&limit=25`
              );
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
                  appointmentId:
                    note.appointment ??
                    note.appointmentId ??
                    note.appointment_id ??
                    undefined,
                  note: note.content ?? note.note ?? "",
                  diagnosis: note.title ?? note.diagnosis,
                  treatment: note.prescription?.instructions ?? note.treatment,
                  followUp: note.follow_up?.notes ?? note.followUp,
                  createdAt:
                    note.created_at ??
                    note.createdAt ??
                    note.timestamp ??
                    new Date().toISOString(),
                  doctorName:
                    note.doctor_name ??
                    note.doctorName ??
                    note.orderedBy ??
                    "Doctor",
                }));
                setClinicalNotes(transformedNotes);
                if (transformedNotes.length > 0) {
                  setHasAnyData(true);
                }
              }
            } catch (notesError) {
              console.warn(
                "Failed to fetch clinical notes (non-blocking):",
                notesError
              );
            }
          })()
        );

        // Appointment history
        tasks.push(
          (async () => {
            try {
              const fetchAppointments = async (id: string) =>
                get<any>(`/api/appointments?patient_id=${id}&limit=100`);

              let appointmentsResponse = await fetchAppointments(targetPatientId);

              // Fallback for environments where route id works differently than Mongo _id.
              if (
                (!appointmentsResponse.success ||
                  extractList<any>(appointmentsResponse.data).length === 0) &&
                patientId &&
                patientId !== targetPatientId
              ) {
                appointmentsResponse = await fetchAppointments(patientId);
              }
              console.log("🔍 Appointments API Response:", {
                success: appointmentsResponse.success,
                data: appointmentsResponse.data,
                dataType: typeof appointmentsResponse.data,
                isArray: Array.isArray(appointmentsResponse.data),
                pagination: (appointmentsResponse as any).pagination,
              });
              if (appointmentsResponse.success) {
                const rawAppointments = extractList<any>(appointmentsResponse.data);
                console.log(
                  "🔍 Raw appointments after extractList:",
                  rawAppointments
                );
                console.log(
                  "🔍 Raw appointments count:",
                  rawAppointments.length
                );

                const fetchedAppointments: Appointment[] = rawAppointments.map(
                  (apt: any) => ({
                    _id: apt._id || apt.id || apt.appointmentId,
                    appointmentId: apt.appointmentId || apt._id || apt.id,
                    patientId: apt.patientId || patientId,
                    doctorId: apt.doctorId || apt.doctor?._id || apt.doctor?.id,
                    date: apt.date,
                    time: apt.time || "",
                    type: apt.type || "Consultation",
                    reason: apt.reason || "",
                    status: apt.status || "scheduled",
                    doctorName:
                      apt.doctorName ||
                      apt.doctor?.fullName ||
                      (apt.doctor?.firstName
                        ? `${apt.doctor?.firstName || ""} ${
                            apt.doctor?.lastName || ""
                          }`.trim()
                        : "Doctor"),
                    patientName: apt.patientName,
                    createdAt: apt.createdAt || apt.created_at,
                    created_at: apt.created_at || apt.createdAt,
                    prescription: apt.prescription,
                    prescriptionMedications: apt.prescriptionMedications,
                    prescriptionFileUrl: apt.prescriptionFileUrl,
                    prescriptionFileName: apt.prescriptionFileName,
                    prescriptionFileKey: apt.prescriptionFileKey,
                    tests: apt.tests,
                    prescribedTest: apt.prescribedTest,
                    diagnosis: apt.diagnosis,
                    treatmentPlan: apt.treatmentPlan,
                    followUpInstructions: apt.followUpInstructions,
                    detailedNotes: apt.detailedNotes,
                    aiRecommendations: apt.aiRecommendations,
                    // Clinical notes fields
                    structuredNotes: apt.structuredNotes,
                    consultationSummary: apt.consultationSummary,
                    consultationNotes: apt.consultationNotes,
                    transcription: apt.transcription,
                    // Patient profile updates tracking
                    patientProfileUpdates: apt.patientProfileUpdates,
                  })
                );

                console.log(
                  "🔍 Final fetched appointments:",
                  fetchedAppointments
                );
                console.log(
                  "🔍 Final fetched appointments count:",
                  fetchedAppointments.length
                );

                setAppointments(fetchedAppointments);
                if (fetchedAppointments.length > 0) {
                  setHasAnyData(true);
                }
              } else {
                console.error(
                  "❌ Failed to fetch appointments:",
                  (appointmentsResponse as any).message || "Unknown error"
                );
              }
            } catch (appointmentsError) {
              console.error(
                "❌ Error fetching appointments:",
                appointmentsError
              );
            }
          })()
        );

          // Run all background tasks without blocking
          Promise.allSettled(tasks).catch((err) => {
            console.warn("Some background data fetching failed:", err);
          });
        };

        // Start background data fetching
        fetchRelatedData();

      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load patient data";
        setError(message);
        console.error('Error in fetchPatientData:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, accessAllowed, accessChecking]);

  // Extract consultation notes from appointments and merge with clinical notes
  useEffect(() => {
    if (!appointments.length || !patientId) return;

    const consultationNotes: ClinicalNote[] = [];

    appointments.forEach((appointment) => {
      // Only include completed appointments (checkout, completed, or past appointments) with consultation data
      const status = (appointment.status || "").toLowerCase();
      const isCompleted = status === "checkout" || status === "completed" || 
                         (status !== "scheduled" && status !== "checked-in" && status !== "in-progress");
      
      if (!isCompleted) return;
      
      if (!appointment.diagnosis && !appointment.detailedNotes && 
          !appointment.treatmentPlan && !appointment.followUpInstructions) {
        return;
      }

      const appointmentDate = appointment.createdAt || appointment.created_at || appointment.date || new Date().toISOString();
      const doctorId = appointment.doctorId || "";
      const doctorName = appointment.doctorName || "Doctor";

      // Create a clinical note from consultation data
      const noteContent = [
        appointment.detailedNotes,
        appointment.diagnosis ? `Diagnosis: ${appointment.diagnosis}` : null,
        appointment.treatmentPlan ? `Treatment Plan: ${appointment.treatmentPlan}` : null,
      ].filter(Boolean).join("\n\n");

      if (noteContent.trim() || appointment.diagnosis || appointment.treatmentPlan || appointment.followUpInstructions) {
        consultationNotes.push({
          _id: `consultation-${appointment._id}`,
          patientId: patientId,
          doctorId: doctorId,
          appointmentId: appointment._id || appointment.appointmentId,
          note: noteContent || appointment.detailedNotes || "Consultation note",
          diagnosis: appointment.diagnosis,
          treatment: appointment.treatmentPlan,
          followUp: appointment.followUpInstructions,
          createdAt: appointmentDate,
          doctorName: doctorName,
        });
      }
    });

    // Merge with existing clinical notes, avoiding duplicates
    setClinicalNotes((existingNotes) => {
      const existingIds = new Set(existingNotes.map(n => n._id));
      const newNotes = consultationNotes.filter(n => !existingIds.has(n._id));
      return [...existingNotes, ...newNotes].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [appointments, patientId]);

  // Extract prescriptions from appointments and merge with medications
  useEffect(() => {
    if (!appointments.length || !patientId) return;

    const consultationMedications: EditableMedicationEntry[] = [];

    appointments.forEach((appointment) => {
      // Only include completed appointments (checkout, completed, or past appointments) with prescription data
      const status = (appointment.status || "").toLowerCase();
      const isCompleted = status === "checkout" || status === "completed" || 
                         (status !== "scheduled" && status !== "checked-in" && status !== "in-progress");
      
      if (!isCompleted) return;
      const prescriptionStr =
        typeof appointment.prescription === "string"
          ? appointment.prescription
          : "";
      if (!prescriptionStr.trim()) return;

      const appointmentDateRaw =
        appointment.createdAt || appointment.created_at || appointment.date;
      if (!appointmentDateRaw) return;
      const appointmentDate =
        typeof appointmentDateRaw === "string"
          ? appointmentDateRaw
          : new Date(appointmentDateRaw).toISOString();
      const startDateStr = appointmentDate.includes("T")
        ? appointmentDate.split("T")[0]
        : appointmentDate;

      // Parse prescription text - try to extract medication name, dosage, frequency
      // This is a simple parser - you may want to enhance it based on your prescription format
      const prescriptionText = prescriptionStr.trim();
      
      // Split by lines or common separators
      const prescriptionLines = prescriptionText
        .split(/\n|,|;/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      prescriptionLines.forEach((line, index) => {
        const medicationId = `consultation-med-${appointment._id}-${index}`;
        
        // Try to extract medication details from the line
        // Common formats: "Medication Name - Dosage - Frequency" or "Medication Name Dosage Frequency"
        const medicationMatch = line.match(/^(.+?)(?:\s*-\s*|\s+)(.+?)(?:\s*-\s*|\s+)(.+)$/) || 
                               line.match(/^(.+?)(?:\s+)(.+)$/) ||
                               [null, line, "", ""];

        if (medicationMatch && medicationMatch[1]) {
          consultationMedications.push({
            _localId: medicationId,
            name: medicationMatch[1].trim(),
            dosage: medicationMatch[2]?.trim() || "",
            frequency: medicationMatch[3]?.trim() || medicationMatch[2]?.trim() || "",
            instructions: prescriptionStr,
            startDate: startDateStr,
            duration: "",
            endDate: "",
            isNew: false, // Mark as existing (from consultation)
          });
        } else if (line) {
          // If parsing fails, treat the whole line as medication name
          consultationMedications.push({
            _localId: medicationId,
            name: line,
            dosage: "",
            frequency: "",
            instructions: prescriptionStr,
            startDate: startDateStr,
            duration: "",
            endDate: "",
            isNew: false, // Mark as existing (from consultation)
          });
        }
      });
    });

    // Merge with existing medications in editForm, avoiding duplicates
    if (consultationMedications.length > 0) {
      setEditForm((prev) => {
        const existingMedIds = new Set(prev.currentMedications.map(m => m._localId));
        const newMedications = consultationMedications.filter(m => !existingMedIds.has(m._localId));
        
        if (newMedications.length === 0) return prev;

        return {
          ...prev,
          currentMedications: [...prev.currentMedications, ...newMedications],
        };
      });
    }
  }, [appointments, patientId]);

  useEffect(() => {
    if (!insuranceRecords.length) {
      setSelectedInsuranceId(null);
      return;
    }
    setSelectedInsuranceId((current) => {
      if (current && insuranceRecords.some((record) => record._id === current)) {
        return current;
      }
      const primary = insuranceRecords.find((record) => record.isPrimary);
      return primary ? primary._id : insuranceRecords[0]._id;
    });
  }, [insuranceRecords]);

  useEffect(() => {
    if (!patientId || !patient || labReports.length > 0) {
      return;
    }

    const normalizedName = (
      patient.fullName ||
      `${patient.firstName ?? ""} ${patient.lastName ?? ""}`
    )
      .trim()
      .toLowerCase();

    if (normalizedName.includes("prakash") && normalizedName.includes("sahu")) {
      setLabReports(createSampleLabReports(patientId));
    }
  }, [patient, patientId, labReports.length]);


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
        bloodGlucose: "",
        respiratoryRate: "",
        height: "",
        },
        currentMedications: [],
        medicalHistoryEntries: [],
        familyHistory: "",
        previousSurgeries: "",
        familyHistoryEntries: [],
        previousSurgeryEntries: [],
      };
    }

    const normalizeTextArray = (
      value?: Array<string | Record<string, unknown>> | string
    ): string => {
      if (!value) return "";
      if (Array.isArray(value)) {
        return value
          .map((entry) => {
            if (typeof entry === "string") {
              return entry;
            }
            if (entry && typeof entry === "object") {
              const record = entry as Record<string, unknown>;
              const possibleFields = [
                "title",
                "diagnosis",
                "notes",
                "name",
                "description",
              ];
              const fieldWithValue = possibleFields.find(
                (field) =>
                  typeof record[field] === "string" && record[field] !== ""
              );
              if (fieldWithValue) {
                return String(record[fieldWithValue]);
              }
              return JSON.stringify(record);
            }
            return String(entry ?? "");
          })
          .filter((entry) => entry.length > 0)
          .join(", ");
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

    const rawFamilyHistory = (patientData as any).familyHistory;
    const rawPreviousSurgeries = (patientData as any).previousSurgeries;

    const parseLines = (value: unknown): string[] => {
      if (typeof value === "string") {
        return value
          .split(/\r?\n|,/)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);
      }
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") {
              const rec = item as Record<string, unknown>;
              return String(
                rec.title ?? rec.condition ?? rec.surgery ?? rec.notes ?? ""
              ).trim();
            }
            return String(item ?? "").trim();
          })
          .filter((segment) => segment.length > 0);
      }
      if (value && typeof value === "object") {
        const rec = value as Record<string, unknown>;
        return [
          String(
            rec.title ?? rec.condition ?? rec.surgery ?? rec.notes ?? ""
          ).trim(),
        ].filter(Boolean);
      }
      return [];
    };

    const mapFamilyHistoryItem = (item: any) => {
      const relation =
        (item?.relation ?? item?.relationship ?? "").trim() ||
        (() => {
          const t = (item?.title ?? "").trim();
          if (!t) return "";
          const dash = t.indexOf(" - ");
          return dash >= 0 ? t.slice(0, dash).trim() : "";
        })();
      const condition =
        (item?.condition ?? item?.disease ?? item?.diagnosis ?? "").trim() ||
        (() => {
          const t = (item?.title ?? "").trim();
          if (!t) return "";
          const dash = t.indexOf(" - ");
          return dash >= 0 ? t.slice(dash + 3).trim() : t;
        })();
      return {
        _localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        relation,
        condition,
        notes: (item?.notes ?? "").trim(),
      };
    };

    const familyHistoryEntries =
      Array.isArray(rawFamilyHistory) && rawFamilyHistory.length
        ? rawFamilyHistory.map(mapFamilyHistoryItem)
        : rawFamilyHistory && typeof rawFamilyHistory === "object" && !Array.isArray(rawFamilyHistory)
          ? [mapFamilyHistoryItem(rawFamilyHistory)]
          : parseLines(rawFamilyHistory).map((line) => ({
            _localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            relation: "",
            condition: line,
            notes: "",
          }));

    const previousSurgeryEntries =
      Array.isArray(rawPreviousSurgeries) && rawPreviousSurgeries.length
        ? rawPreviousSurgeries.map((item: any) => ({
            _localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            surgery: item?.surgery ?? "",
            date: item?.date ?? "",
            hospital: item?.hospital ?? "",
            notes: item?.notes ?? "",
          }))
        : parseLines(rawPreviousSurgeries).map((line) => ({
            _localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            surgery: line,
            date: "",
            hospital: "",
            notes: "",
          }));

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
        bloodGlucose: vitalsData?.bloodGlucose
          ? String(vitalsData.bloodGlucose)
          : "",
        respiratoryRate: vitalsData?.respiratoryRate
          ? String(vitalsData.respiratoryRate)
          : "",
        height: vitalsData?.height ? String(vitalsData.height) : "",
      },
      currentMedications: (patientData.currentMedications || []).map((med) =>
        createEditableMedication(med, false)
      ),
      medicalHistoryEntries: (() => {
        const history = patientData.medicalHistory;
        if (!history) return [];
        if (Array.isArray(history)) {
          return history
            .map((entry) => {
              if (typeof entry === "string") {
                const title = entry.trim();
                if (!title) return null;
                return createEditableHistoryEntry({ title }, false);
              }
              if (entry && typeof entry === "object") {
                const typed = entry as MedicalHistoryRecord;
                return createEditableHistoryEntry(
                  {
                    title: typed.title ?? "",
                    diagnosis: typed.diagnosis ?? "",
                    treatedBy: typed.treatedBy ?? "",
                    recordedOn: typed.recordedOn ?? "",
                    notes: typed.notes ?? "",
                  },
                  false
                );
              }
              return null;
            })
            .filter(
              (item): item is EditableMedicalHistoryEntry => Boolean(item)
            );
        }
        if (typeof history === "string") {
          return history
            .split(/\r?\n|,/)
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0)
            .map((segment) =>
              createEditableHistoryEntry({ title: segment }, false)
            );
        }
        return [];
      })(),
      familyHistory: "",
      previousSurgeries: "",
      familyHistoryEntries,
      previousSurgeryEntries,
    };
  };

  const isOverviewEditing = isGlobalEditMode || activeEditSection === "overview";
  const isHistoryEditing = isGlobalEditMode || activeEditSection === "history";
  const isMedicationsEditing = isGlobalEditMode || activeEditSection === "medications";

  const beginSectionEditing = (section: EditableSection) => {
    if (isGlobalEditMode) return;
    setActiveEditSection(section);
    setDirtySections((prev) => ({ ...prev, [section]: false }));
    setProfileError(null);
  };

  const cancelSectionEditing = (section: EditableSection) => {
    if (isGlobalEditMode) return;
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
    value !== undefined ? value.trim() : undefined;

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
    (
      [
        "bloodPressure",
        "heartRate",
        "temperature",
        "oxygenSaturation",
        "weight",
        "bloodGlucose",
        "respiratoryRate",
        "height",
      ] as const
    ).forEach((key) => {
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

  const buildHistoryPayload = () => {
    const cleanedHistory = editForm.medicalHistoryEntries
      .map((entry) => {
        const sanitized: MedicalHistoryRecord = {
          title: entry.title?.trim() || undefined,
          diagnosis: entry.diagnosis?.trim() || undefined,
          treatedBy: entry.treatedBy?.trim() || undefined,
          recordedOn: entry.recordedOn?.trim() || undefined,
          notes: entry.notes?.trim() || undefined,
        };
        const hasValue = Object.values(sanitized).some(
          (value) => typeof value === "string" && value.length > 0
        );
        if (!hasValue) {
          return null;
        }
        return sanitized;
      })
      .filter((item): item is MedicalHistoryRecord => Boolean(item));

    const payload: Record<string, unknown> = {
      medicalHistory: cleanedHistory,
    };

    const formattedFamilyHistory = editForm.familyHistoryEntries
      .map((entry) => {
        const relation = entry.relation?.trim();
        const condition = entry.condition?.trim();
        const notes = entry.notes?.trim();

        if (!relation && !condition && !notes) {
          return null;
        }

        const mainParts = [relation, condition].filter(Boolean);
        const mainText = mainParts.join(" - ");

        if (notes) {
          return mainText ? `${mainText} (${notes})` : notes;
        }
        return mainText;
      })
      .filter((line): line is string => Boolean(line));

    if (formattedFamilyHistory.length > 0) {
      payload.familyHistory = editForm.familyHistoryEntries.map((entry) => ({
        relation: entry.relation?.trim() || undefined,
        condition: entry.condition?.trim() || undefined,
        notes: entry.notes?.trim() || undefined,
      }));
    }

    const formattedPreviousSurgeries = editForm.previousSurgeryEntries
      .map((entry) => {
        const surgery = entry.surgery?.trim();
        const date = entry.date?.trim();
        const hospital = entry.hospital?.trim();
        const notes = entry.notes?.trim();

        if (!surgery && !date && !hospital && !notes) {
          return null;
        }

        const mainParts = [surgery, date, hospital].filter(Boolean);
        const mainText = mainParts.join(" • ");

        if (notes) {
          return mainText ? `${mainText} (${notes})` : notes;
        }
        return mainText;
      })
      .filter((line): line is string => Boolean(line));

    if (formattedPreviousSurgeries.length > 0) {
      payload.previousSurgeries = editForm.previousSurgeryEntries.map((entry) => ({
        surgery: entry.surgery?.trim() || undefined,
        date: entry.date?.trim() || undefined,
        hospital: entry.hospital?.trim() || undefined,
        notes: entry.notes?.trim() || undefined,
      }));
    }

    return payload;
  };

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

  const handleAddFamilyHistoryEntry = () => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      familyHistoryEntries: [
        ...prev.familyHistoryEntries,
        {
          _localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          relation: "",
          condition: "",
          notes: "",
        },
      ],
    }));
  };

  const handleFamilyHistoryEntryChange = (
    id: string,
    field: "relation" | "condition" | "notes",
    value: string
  ) => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      familyHistoryEntries: prev.familyHistoryEntries.map((entry) =>
        entry._localId === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleRemoveFamilyHistoryEntry = (id: string) => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      familyHistoryEntries: prev.familyHistoryEntries.filter(
        (entry) => entry._localId !== id
      ),
    }));
  };

  const handleAddPreviousSurgeryEntry = () => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      previousSurgeryEntries: [
        ...prev.previousSurgeryEntries,
        {
          _localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          surgery: "",
          date: "",
          hospital: "",
          notes: "",
        },
      ],
    }));
  };

  const handlePreviousSurgeryEntryChange = (
    id: string,
    field: "surgery" | "date" | "hospital" | "notes",
    value: string
  ) => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      previousSurgeryEntries: prev.previousSurgeryEntries.map((entry) =>
        entry._localId === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleRemovePreviousSurgeryEntry = (id: string) => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      previousSurgeryEntries: prev.previousSurgeryEntries.filter(
        (entry) => entry._localId !== id
      ),
    }));
  };

  const applyPatientUpdate = (updatedPatient: Patient) => {
    setPatient((prev) => {
      const mergedPatient: Patient = {
        ...(prev ?? displayPatient),
        ...updatedPatient,
        fullName:
          updatedPatient.fullName ??
          `${updatedPatient.firstName ?? ""} ${updatedPatient.lastName ?? ""}`.trim(),
      };
      return mergedPatient;
    });
    setEditForm(mapPatientToFormState(updatedPatient));
  };

  const handleSaveSection = async (section: EditableSection) => {
    if (!canEditPatientProfile) return;
    if (isGlobalEditMode) return;
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

      applyPatientUpdate(updated as unknown as Patient);
      setActiveEditSection(null);
      setDirtySections((prev) => ({ ...prev, [section]: false }));


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

  const handleStartGlobalEdit = () => {
    if (!canEditPatientProfile) return;
    setActiveEditSection(null);
    setProfileError(null);
    setEditForm(mapPatientToFormState(patient));
    resetDirtySections();
    setIsGlobalEditMode(true);
  };

  const handleCancelGlobalEdit = () => {
    resetDirtySections();
    setProfileError(null);
    setEditForm(mapPatientToFormState(patient));
    setIsGlobalEditMode(false);
    setActiveEditSection(null);
  };

  const handleSaveAll = async () => {
    if (!canEditPatientProfile || isSavingAll) return;

    const targetPatientId = patient?._id || patientId;
    if (!targetPatientId) {
      setProfileError("Unable to determine which patient to update.");
      return;
    }

    const combinedPayload: Record<string, unknown> = {};
    const updatedSections: EditableSection[] = [];

    if (dirtySections.overview) {
      const overviewPayload = buildOverviewPayload();
      if (!overviewPayload) {
        return;
      }
      if (Object.keys(overviewPayload).length > 0) {
        Object.assign(combinedPayload, overviewPayload);
        updatedSections.push("overview");
      }
    }

    if (dirtySections.history) {
      const historyPayload = buildHistoryPayload();
      if (historyPayload) {
        Object.assign(combinedPayload, historyPayload);
        updatedSections.push("history");
      }
    }

    if (dirtySections.medications) {
      const medicationsPayload = buildMedicationsPayload();
      Object.assign(combinedPayload, medicationsPayload);
      updatedSections.push("medications");
    }

    if (Object.keys(combinedPayload).length === 0) {
      toast({
        title: "No changes detected",
        description: "Make updates before saving, or cancel edit mode.",
      });
      return;
    }

    setIsSavingAll(true);
    setProfileError(null);

    try {
      const updated = await updatePatient(targetPatientId, combinedPayload);

      applyPatientUpdate(updated as unknown as Patient);
      resetDirtySections();
      setIsGlobalEditMode(false);
      setActiveEditSection(null);


      const sectionLabels: Record<EditableSection, string> = {
        overview: "Overview",
        history: "Medical history",
        medications: "Medications",
      };

      toast({
        title: "Patient profile updated",
        description: `Saved changes to ${updatedSections
          .map((section) => sectionLabels[section])
          .join(", ")}.`,
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
      setIsSavingAll(false);
    }
  };

  type EditableHistoryField = keyof Pick<
    EditableMedicalHistoryEntry,
    "title" | "diagnosis" | "treatedBy" | "recordedOn" | "notes"
  >;

  const handleHistoryEntryChange = (
    entryId: string,
    field: EditableHistoryField,
    value: string
  ) => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      medicalHistoryEntries: prev.medicalHistoryEntries.map((entry) =>
        entry._localId === entryId ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleAddHistoryEntry = () => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      medicalHistoryEntries: [
        ...prev.medicalHistoryEntries,
        createEditableHistoryEntry({}, true),
      ],
    }));
  };

  const handleRemoveHistoryEntry = (entryId: string) => {
    markSectionDirty("history");
    setEditForm((prev) => ({
      ...prev,
      medicalHistoryEntries: prev.medicalHistoryEntries.filter(
        (entry) => entry._localId !== entryId
      ),
    }));
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
    markSectionDirty("medications");
    setEditForm((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(
        (med) => med._localId !== medId
      ),
    }));
  };

  const handleViewLabReport = (report: LabReport) => {
    const viewerData = mapReportToViewerData(report);
    setSelectedLabReport(viewerData);
    setLabReportViewerOpen(true);
  };

  const handleViewS3Report = (report: S3Report) => {
    setSelectedS3Report(report);
    setS3ReportViewerOpen(true);
  };

  const handleLabUploadClick = () => {
    labUploadInputRef.current?.click();
  };

  const handleLabPdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !patient?._id) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF lab report.",
        variant: "destructive",
      });
      return;
    }
    setLabUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await post<{ report: S3Report }>(
        `/api/s3-reports/patient/${patient._id}/upload`,
        formData
      );
      const report = res.data?.report;
      if (res.success && report) {
        setS3Reports((prev) => [report, ...prev.filter((x) => x._id !== report._id)]);
        toast({
          title: "Report uploaded",
          description: "AI parsing is running in the background. Refresh in a moment for full results.",
        });
      } else {
        toast({
          title: "Upload failed",
          description: res.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLabUploadLoading(false);
    }
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
  const patientVitals = (displayPatient.vitals ?? {}) as Partial<
    Record<string, string | number>
  >;
  
  // Merge vitals from patient object and vitals array (vitals array takes precedence)
  const mergedVitals = {
    bloodPressure: latestVitals?.bloodPressure || patientVitals.bloodPressure,
    heartRate: latestVitals?.heartRate || patientVitals.heartRate,
    temperature: latestVitals?.temperature || patientVitals.temperature,
    oxygenSaturation: latestVitals?.oxygenSaturation || patientVitals.oxygenSaturation,
    weight: latestVitals?.weight || patientVitals.weight,
    height: latestVitals?.height || patientVitals.height,
    bloodGlucose: latestVitals?.bloodGlucose || patientVitals.bloodGlucose,
    respiratoryRate: latestVitals?.respiratoryRate || patientVitals.respiratoryRate,
    bmi: patientVitals.bmi,
  };

  const activeVitals = {
    bloodPressure: isOverviewEditing ? editForm.vitals.bloodPressure : mergedVitals.bloodPressure,
    heartRate: isOverviewEditing ? editForm.vitals.heartRate : mergedVitals.heartRate,
    temperature: isOverviewEditing ? editForm.vitals.temperature : mergedVitals.temperature,
    oxygenSaturation: isOverviewEditing ? editForm.vitals.oxygenSaturation : mergedVitals.oxygenSaturation,
    weight: isOverviewEditing ? editForm.vitals.weight : mergedVitals.weight,
    bloodGlucose: isOverviewEditing ? editForm.vitals.bloodGlucose : mergedVitals.bloodGlucose,
    respiratoryRate: isOverviewEditing ? editForm.vitals.respiratoryRate : mergedVitals.respiratoryRate,
    height: isOverviewEditing ? editForm.vitals.height : mergedVitals.height,
  };

  const savedMedications = editForm.currentMedications.filter((med) => !med.isNew);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const medicationHistory = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        name: string;
        entries: EditableMedicationEntry[];
        latest: EditableMedicationEntry;
        latestTimestamp: number;
      }
    >();

    savedMedications.forEach((med) => {
      const name = med.name?.trim() || "Unnamed medication";
      const key = name.toLocaleLowerCase();
      const timestamp = new Date(
        med.startDate || med.endDate || ""
      ).getTime();
      const sortableTimestamp = Number.isNaN(timestamp) ? 0 : timestamp;
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          key,
          name,
          entries: [med],
          latest: med,
          latestTimestamp: sortableTimestamp,
        });
        return;
      }

      existing.entries.push(med);
      if (sortableTimestamp >= existing.latestTimestamp) {
        existing.latest = med;
        existing.latestTimestamp = sortableTimestamp;
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.latestTimestamp - a.latestTimestamp || a.name.localeCompare(b.name),
    );
  }, [savedMedications]);

  const filteredMedicationHistory = useMemo(() => {
    const query = medicationSearch.trim().toLocaleLowerCase();
    if (!query) return medicationHistory;
    return medicationHistory.filter(({ name, latest, entries }) =>
      [name, latest.dosage, latest.frequency, latest.instructions, ...entries.map((entry) => entry.duration)]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
  }, [medicationHistory, medicationSearch]);

  const medicationPrescriptionCount = useMemo(
    () =>
      new Set(
        savedMedications.map(
          (med) =>
            `${med.startDate || ""}|${med.instructions || ""}|${med._localId.split("-").slice(0, -1).join("-")}`,
        ),
      ).size,
    [savedMedications],
  );

  const focusMedicationHistory = () => {
    setMedicationSearch("");
    medicationHistoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const groupedS3Reports = useMemo(() => {
    if (!s3Reports.length) return [];
    const groups = new Map<
      string,
      { label: string; reports: S3Report[]; sortKey: number }
    >();

    s3Reports.forEach((report) => {
      const reportDate =
        report.parsedLabReport?.reportedDate ||
        report.parsedLabReport?.collectedDate ||
        report.createdAt;
      const parsedDate = reportDate ? new Date(reportDate) : null;
      const label = parsedDate
        ? parsedDate.toLocaleString("en-US", { month: "long", year: "numeric" })
        : "Uncategorized";

      const existing = groups.get(label);
      if (existing) {
        existing.reports.push(report);
        if (parsedDate && parsedDate.getTime() > existing.sortKey) {
          existing.sortKey = parsedDate.getTime();
        }
      } else {
        groups.set(label, {
          label,
          reports: [report],
          sortKey: parsedDate ? parsedDate.getTime() : 0,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [s3Reports]);

  const appointmentBuckets = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return { upcoming: [] as Appointment[], past: [] as Appointment[] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate date comparison
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    // Helper to compute a sortable timestamp using both date and time (if available)
    const getAppointmentTimestamp = (appointment: Appointment): number => {
      if (!appointment || !appointment.date) return 0;
      try {
        if (appointment.time) {
          const combined = `${appointment.date}T${appointment.time}`;
          const dt = new Date(combined);
          if (!isNaN(dt.getTime())) return dt.getTime();
        }
        const d = new Date(appointment.date);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      } catch {
        return 0;
      }
    };

    appointments.forEach((appointment) => {
      const status = (appointment?.status || "").toLowerCase();

      // Hide cancelled appointments from the profile tab lists.
      if (status.includes("cancel")) {
        return;
      }

      if (!appointment || !appointment.date) {
        // If no date, consider it past
        past.push(appointment);
        return;
      }

      try {
        // Parse appointment date (format: YYYY-MM-DD)
        const appointmentDate = new Date(appointment.date);
        
        // Check if date is valid
        if (isNaN(appointmentDate.getTime())) {
          console.warn(`Invalid date for appointment ${appointment._id}: ${appointment.date}`);
          past.push(appointment);
          return;
        }
        
        appointmentDate.setHours(0, 0, 0, 0); // Reset to start of day
        
        // Determine if appointment is upcoming or past
        const dateInFuture = appointmentDate.getTime() > today.getTime();
        const dateIsToday = appointmentDate.getTime() === today.getTime();
        const activeStatuses = ["scheduled", "checked-in", "in-progress"];
        const isActiveStatus = activeStatuses.includes(status);
        
        // Appointment is upcoming if:
        // 1. Date is in the future, OR
        // 2. Date is today AND status is active (scheduled/checked-in/in-progress)
        const isUpcoming = dateInFuture || (dateIsToday && isActiveStatus);

        if (isUpcoming) {
          upcoming.push(appointment);
        } else {
          past.push(appointment);
        }
      } catch (err) {
        console.error(`Error processing appointment ${appointment._id}:`, err);
        past.push(appointment);
      }
    });

    // Upcoming: oldest first; Past: latest first (using full date + time)
    upcoming.sort((a, b) => getAppointmentTimestamp(a) - getAppointmentTimestamp(b));
    past.sort((a, b) => getAppointmentTimestamp(b) - getAppointmentTimestamp(a));

    return { upcoming, past };
  }, [appointments]);

  const upcomingAppointments = appointmentBuckets.upcoming;
  const pastAppointments = appointmentBuckets.past;

  const groupedPastAppointments = useMemo(() => {
    if (!pastAppointments.length) return [];
    const groups = new Map<
      string,
      { label: string; appointments: Appointment[]; sortKey: number }
    >();

    pastAppointments.forEach((appointment) => {
      const parsedDate = appointment.date ? new Date(appointment.date) : null;
      const label = parsedDate
        ? parsedDate.toLocaleString("en-US", { month: "long", year: "numeric" })
        : "Uncategorized";

      const existing = groups.get(label);
      if (existing) {
        existing.appointments.push(appointment);
        if (parsedDate && parsedDate.getTime() > existing.sortKey) {
          existing.sortKey = parsedDate.getTime();
        }
      } else {
        groups.set(label, {
          label,
          appointments: [appointment],
          sortKey: parsedDate ? parsedDate.getTime() : 0,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [pastAppointments]);

  // Group clinical notes by appointment for quick lookup in the UI
  const clinicalNotesByAppointment = useMemo(() => {
    const map = new Map<string, ClinicalNote[]>();
    clinicalNotes.forEach((note) => {
      const key =
        note.appointmentId ||
        (note as any).appointment ||
        (note as any).appointmentId ||
        (note as any).appointment_id;
      if (!key) return;
      const existing = map.get(key) || [];
      existing.push(note);
      map.set(key, existing);
    });
    return map;
  }, [clinicalNotes]);

  // Helper function to check if appointment was created today
  const isAppointmentCreatedToday = (appointment: Appointment): boolean => {
    if (!appointment) return false;
    const createdAt = appointment.createdAt || appointment.created_at;
    if (!createdAt) return false;
    
    const createdDate = new Date(createdAt);
    const today = new Date();
    
    return (
      createdDate.getDate() === today.getDate() &&
      createdDate.getMonth() === today.getMonth() &&
      createdDate.getFullYear() === today.getFullYear()
    );
  };

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

  const insuranceClaims = Array.isArray(displayPatient.insuranceClaims)
    ? displayPatient.insuranceClaims
    : [];

  const fallbackInsuranceMeta = displayPatient as Record<string, any>;

  const activeInsuranceRecord = useMemo(() => {
    if (!insuranceRecords.length) return null;
    if (selectedInsuranceId) {
      const selected = insuranceRecords.find((record) => record._id === selectedInsuranceId);
      if (selected) {
        return selected;
      }
    }
    return (
      insuranceRecords.find((record) => record.isPrimary) ?? insuranceRecords[0]
    );
  }, [insuranceRecords, selectedInsuranceId]);

  // Load insurance coverage for active policy
  const resolvedCoveragePatientId = activeInsuranceRecord?.patientId || patient?._id || patientId;

  useEffect(() => {
    const loadCoverage = async () => {
      if (!activeInsuranceRecord) {
        // Reset to default if no insurance records
        setSelectedBenefits(
          new Set([
            "Hospitalization",
            "Surgical Procedures",
            "Medical Examination",
            "Medications",
            "Pre-existing Conditions",
            "Outpatient Services",
          ])
        );
        return;
      }

      const policyNumber = activeInsuranceRecord.policyNumber || activeInsuranceRecord.cardNumber;
      if (!policyNumber || !resolvedCoveragePatientId) return;

      try {
        const coverage = await fetchInsuranceCoverage(resolvedCoveragePatientId, policyNumber);
        if (coverage && !Array.isArray(coverage) && coverage.selectedBenefits) {
          setSelectedBenefits(new Set(coverage.selectedBenefits));
        } else if (Array.isArray(coverage) && coverage.length > 0) {
          setSelectedBenefits(new Set(coverage[0].selectedBenefits || []));
        }
      } catch (err) {
        // If no coverage found, use defaults
        console.log("No coverage found, using defaults");
      }
    };

    loadCoverage();
  }, [activeInsuranceRecord, resolvedCoveragePatientId]);

  const insuranceProviderName =
    activeInsuranceRecord?.provider ||
    fallbackInsuranceMeta.insuranceProvider ||
    "Insurance Provider";

  const insurancePlanName =
    activeInsuranceRecord?.planName ||
    fallbackInsuranceMeta.insurancePlanName ||
    insuranceProviderName ||
    "Insurance Plan";

  const insuranceStatus =
    activeInsuranceRecord?.status ||
    fallbackInsuranceMeta.insuranceStatus ||
    (fallbackInsuranceMeta.insuranceProvider ? "Active" : "Inactive");

  const insuranceValidFrom =
    activeInsuranceRecord?.validFrom || fallbackInsuranceMeta.insuranceValidFrom;
  const insuranceValidUntil =
    activeInsuranceRecord?.validUntil || fallbackInsuranceMeta.insuranceValidUntil;

  const familyMembersCovered =
    activeInsuranceRecord?.familyMembersCovered ??
    fallbackInsuranceMeta.insuranceFamilyMembersCovered ??
    fallbackInsuranceMeta.familyMembersCovered ??
    fallbackInsuranceMeta.coveredMembers;

  const parseCurrencyValue = (raw?: string) => {
    if (!raw) return 0;
    const normalized = raw.replace(/[^0-9.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrencyInr = (value: number) => {
    if (!value || value <= 0) return "₹0";
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  };

  const coverageLimitSource =
    activeInsuranceRecord?.coverageLimit || fallbackInsuranceMeta.insuranceCoverageLimit;
  const coverageUsedSource =
    activeInsuranceRecord?.coverageUsed || fallbackInsuranceMeta.insuranceCoverageUsed;
  const coverageRemainingSource =
    activeInsuranceRecord?.coverageRemaining || fallbackInsuranceMeta.insuranceCoverageRemaining;

  const coverageTotalValue = parseCurrencyValue(coverageLimitSource);
  const coverageUsedValue = parseCurrencyValue(coverageUsedSource);
  const coverageRemainingValue = coverageRemainingSource
    ? parseCurrencyValue(coverageRemainingSource)
    : coverageTotalValue > 0
    ? Math.max(coverageTotalValue - coverageUsedValue, 0)
    : 0;
  const coverageProgress =
    coverageTotalValue > 0
      ? Math.min((coverageUsedValue / coverageTotalValue) * 100, 100)
      : coverageUsedValue > 0
      ? 100
      : 0;

  const formatCoverageLabel = (raw?: string, fallbackNumeric = 0) => {
    if (raw && raw.trim().length > 0) {
      return raw;
    }
    return formatCurrencyInr(fallbackNumeric);
  };

  const coverageSummary = {
    total: formatCoverageLabel(coverageLimitSource, coverageTotalValue),
    used: formatCoverageLabel(coverageUsedSource, coverageUsedValue),
    remaining: formatCurrencyInr(coverageRemainingValue),
  };

  const daysRemainingCount = (() => {
    if (!insuranceValidUntil) return null;
    const diff = new Date(insuranceValidUntil).getTime() - Date.now();
    if (Number.isNaN(diff)) return null;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  })();

  const daysRemainingLabel =
    daysRemainingCount === null
      ? "—"
      : `${daysRemainingCount} ${daysRemainingCount === 1 ? "day" : "days"}`;

  const insuranceValidFromLabel = insuranceValidFrom
    ? formatDisplayDate(insuranceValidFrom, "Not available")
    : "Not available";
  const insuranceValidUntilLabel = insuranceValidUntil
    ? formatDisplayDate(insuranceValidUntil, "Not available")
    : "Not available";

  const familyCoverageLabel = (() => {
    if (familyMembersCovered === undefined || familyMembersCovered === null) {
      return "Family coverage details pending update";
    }
    if (typeof familyMembersCovered === "number") {
      return `${familyMembersCovered} family member${
        familyMembersCovered === 1 ? "" : "s"
      } covered`;
    }
    const parsed = Number(String(familyMembersCovered).replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(parsed) && parsed > 0) {
      return `${parsed} family member${parsed === 1 ? "" : "s"} covered`;
    }
    return String(familyMembersCovered);
  })();

  const insuranceCardNumberDisplay =
    activeInsuranceRecord?.cardNumber ||
    activeInsuranceRecord?.policyNumber ||
    displayPatient.insuranceNumber ||
    "Not provided";

  const insurancePolicyNumberDisplay =
    activeInsuranceRecord?.policyNumber ||
    displayPatient.insuranceNumber ||
    "Not provided";

  const insuranceMemberName =
    activeInsuranceRecord?.memberName || displayPatient.fullName || "Member";

  const insuranceNotesDisplay =
    activeInsuranceRecord?.notes ||
    displayPatient.insuranceNotes ||
    "Insurance verification is handled by the receptionist team. Please ensure policy details are up to date before processing claims.";

  const hasInsuranceRecords = insuranceRecords.length > 0;
  const canManageInsurance = canEditPatientProfile;

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

  const normalizeLabTests = (tests: LabTest[] = []): LabReportData["tests"] =>
    tests.map((test) => {
      const status = (() => {
        switch (test.status) {
          case "normal":
          case "high":
          case "low":
          case "critical":
            return test.status;
          default:
            return "normal" as const;
        }
      })();

      return {
        name: test.name || "Test Result",
        result: test.result || "—",
        unit: test.unit || "—",
        normalRange: test.normalRange || "—",
        status,
        flag: test.flag,
      };
    });

  const createSampleLabReports = (patientIdValue: string): LabReport[] => {
    const baseDoctor = "Dr. Nisha Verma";
    const collected = "2023-11-15T08:00:00.000Z";
    const reported = "2023-11-16T09:00:00.000Z";

    return [
      {
        _id: `sample-${patientIdValue}-cbc`,
        patientId: patientIdValue,
        doctorId: "DOC-001",
        reportId: "CBC-2023-11-15",
        reportType: "Complete Blood Count",
        category: "Hematology",
        orderedBy: baseDoctor,
        labName: "City Diagnostic Center",
        collectedDate: collected,
        reportedDate: reported,
        notes: "Baseline CBC looks stable.",
        isReviewed: true,
        tests: [
          {
            name: "Hemoglobin",
            result: "13.8",
            unit: "g/dL",
            normalRange: "13.2 - 16.6",
            status: "normal",
          },
          {
            name: "White Blood Cells",
            result: "7.2",
            unit: "10^3/uL",
            normalRange: "4.0 - 10.5",
            status: "normal",
          },
        ],
      },
      {
        _id: `sample-${patientIdValue}-renal`,
        patientId: patientIdValue,
        doctorId: "DOC-001",
        reportId: "RENAL-2023-11-15",
        reportType: "Kidney Function",
        category: "Biochemistry",
        orderedBy: baseDoctor,
        labName: "City Diagnostic Center",
        collectedDate: collected,
        reportedDate: reported,
        notes: "Renal profile is within range.",
        isReviewed: true,
        tests: [
          {
            name: "Serum Creatinine",
            result: "0.9",
            unit: "mg/dL",
            normalRange: "0.7 - 1.3",
            status: "normal",
          },
          {
            name: "Blood Urea Nitrogen",
            result: "14",
            unit: "mg/dL",
            normalRange: "7 - 20",
            status: "normal",
          },
        ],
      },
    ];
  };

  const mapReportToViewerData = (report: LabReport): LabReportData => {
    const parsedAge = parseInt(displayPatient.age ?? "", 10);
    const doctorName = report.orderedBy || report.reviewedBy || report.doctorId || "Doctor";
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
      doctorCommentAuthor: report.notes ? doctorName : undefined,
      interpretation: report.interpretation,
    };
  };

  if (accessChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Checking access</h2>
          <p className="text-muted-foreground">Validating consultation permissions…</p>
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-xl">
          <ShieldCheckIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access restricted</h2>
          <p className="text-muted-foreground mb-4">
            Patient details are only accessible to the assigned doctor during an active consultation.
          </p>
          <Button onClick={() => navigate("/doctor-dashboard")} variant="outline" className="mr-2">
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(-1)} variant="default">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Patient Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mr-2"
          >
            Go Back
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="default"
          >
            Retry
          </Button>
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

      {/* S3 Report Viewer Dialog */}
      <S3ReportViewerDialog
        open={s3ReportViewerOpen}
        onOpenChange={setS3ReportViewerOpen}
        report={selectedS3Report}
        patient={patient}
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
                {(typeof displayPatient.fullName === "string"
                  ? displayPatient.fullName
                  : ""
                )
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

                {returnTo && !isEmbedded && (
                  <Button
                    variant="outline"
                    className="md:ml-auto"
                    onClick={() => navigate(returnTo)}
                  >
                    Back to Consultation
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm leading-relaxed">
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
                  <MailIcon className="w-4 h-4 text-[#00C4B3]" />
                  <span className="text-foreground">
                    {(displayPatient as any).medieaseClinicEmail || "Not generated"}
                  </span>
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
                    Last Visit: {lastVisitDisplay || "Not available"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-start md:ml-auto md:items-end">
              {/* Hide Schedule Appointment button when viewing from consultation (queueId present) */}
              {!queueId && (
                <Button
                  size="sm"
                  className="px-4 bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                  onClick={() => {
                    if (!patientId) return;
                    
                    // Determine the appointments page based on user role
                    let appointmentsPath = "/receptionist-appointments";
                    if (user?.role === "doctor") {
                      appointmentsPath = "/doctor-appointments";
                    } else if (user?.role === "admin") {
                      appointmentsPath = "/admin-appointments";
                    }
                    
                    // Navigate to appointments page with patient ID as query parameter
                    navigate(`${appointmentsPath}?patientId=${encodeURIComponent(patientId)}`);
                  }}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Button>
              )}
              {canEditPatientProfile && (
                isGlobalEditMode ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleCancelGlobalEdit}
                      disabled={isSavingAll}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#24B173] hover:bg-[#1A8F58] text-white"
                      onClick={handleSaveAll}
                      disabled={!hasUnsavedChanges || isSavingAll}
                    >
                      {isSavingAll ? (
                        <>
                          <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
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
                    className="border-[#24B173]/30 text-[#24B173] hover:bg-[#24B173]/10"
                    onClick={handleStartGlobalEdit}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Edit Patient
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
                        <div className="text-center w-full">
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            Blood Glucose
                          </p>
                          {isOverviewEditing ? (
                            <Input
                              className="text-center"
                              placeholder="95"
                              value={editForm.vitals.bloodGlucose}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    bloodGlucose: event.target.value,
                                  },
                                }));
                              }}
                            />
                          ) : (
                            <p className="text-xs font-semibold text-foreground">
                              {activeVitals.bloodGlucose
                                ? `${activeVitals.bloodGlucose} mg/dL`
                                : "—"}
                            </p>
                          )}
                          <Badge className="mt-0.5 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 text-[10px] px-1.5 py-0">
                            {activeVitals.bloodGlucose ? "Recorded" : "Not recorded"}
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
                        <div className="text-center w-full">
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            Respiratory Rate
                          </p>
                          {isOverviewEditing ? (
                            <Input
                              className="text-center"
                              placeholder="16"
                              value={editForm.vitals.respiratoryRate}
                              onChange={(event) => {
                                markSectionDirty("overview");
                                setEditForm((prev) => ({
                                  ...prev,
                                  vitals: {
                                    ...prev.vitals,
                                    respiratoryRate: event.target.value,
                                  },
                                }));
                              }}
                            />
                          ) : (
                            <p className="text-xs font-semibold text-foreground">
                              {activeVitals.respiratoryRate
                                ? `${activeVitals.respiratoryRate} bpm`
                                : "—"}
                            </p>
                          )}
                          <Badge className="mt-0.5 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 text-[10px] px-1.5 py-0">
                            {activeVitals.respiratoryRate ? "Recorded" : "Not recorded"}
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
                    <PillIcon className="w-5 h-5 text-[#fb7185]" />
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
                    {queueId || appointmentId ? "Last Visit Condition" : "Current Condition"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isOverviewEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {queueId || appointmentId ? "Last Visit Condition" : "Condition"}
                        </Label>
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
                        <Label className="text-xs text-muted-foreground">
                          {queueId || appointmentId ? "Last Visit Care Plan Summary" : "Care Plan Summary"}
                        </Label>
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
                        <Label className="text-xs text-muted-foreground">
                          {queueId || appointmentId ? "Last Visit Follow-up Plan" : "Follow-up Plan"}
                        </Label>
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
                        <Label className="text-xs text-muted-foreground">
                          {queueId || appointmentId ? "Last Visit Chief Complaint" : "Chief Complaint"}
                        </Label>
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
                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                      {/* Left column: condition + chief complaint */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wide">
                            {queueId || appointmentId ? "Last Visit Condition" : "Condition"}
                          </p>
                          <p className="text-base text-foreground">
                            {(queueId || appointmentId)
                              ? (lastVisitCondition || "No Diagnosis")
                              : (displayPatient.condition || "Not recorded")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wide">
                            {queueId || appointmentId ? "Last Visit Chief Complaint" : "Chief Complaint"}
                          </p>
                    <p className="text-sm text-muted-foreground">
                            {displayPatient.chiefComplaint || "Not recorded"}
                    </p>
                    </div>
                      </div>

                      {/* Right column: care plan + follow-up */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wide">
                            {queueId || appointmentId ? "Last Visit Care Plan Summary" : "Care Plan Summary"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {displayPatient.carePlanSummary || "Not recorded"}
                          </p>
                    </div>
                        <div>
                          <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wide">
                            {queueId || appointmentId ? "Last Visit Follow-up Plan" : "Follow-up Plan"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {displayPatient.followUpPlan || "Not recorded"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-muted/30">
            <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div />
              {canEditPatientProfile && !isGlobalEditMode && (
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

            <div className="px-6 py-5 space-y-6">
              {/* Family history entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-[#22c55e]" />
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Family History
                    </Label>
                  </div>
                  {isHistoryEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFamilyHistoryEntry}
                    >
                      <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                      Add family history
                    </Button>
                  )}
                </div>
                {isHistoryEditing ? (
                  editForm.familyHistoryEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No family history recorded yet. Use &quot;Add family history&quot; to capture
                      relevant family conditions.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {editForm.familyHistoryEntries.map((entry) => (
                        <div
                          key={entry._localId}
                          className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                              Family Member
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-600"
                              onClick={() => handleRemoveFamilyHistoryEntry(entry._localId)}
                              aria-label="Remove family history entry"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Relation</Label>
                              <Input
                                placeholder="e.g., Father, Mother, Sibling"
                                value={entry.relation}
                                onChange={(event) =>
                                  handleFamilyHistoryEntryChange(
                                    entry._localId,
                                    "relation",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Condition</Label>
                              <Input
                                placeholder="e.g., Hypertension, Type 2 Diabetes"
                                value={entry.condition}
                                onChange={(event) =>
                                  handleFamilyHistoryEntryChange(
                                    entry._localId,
                                    "condition",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Notes</Label>
                            <Textarea
                              rows={2}
                              placeholder="Additional context, age of onset, complications..."
                              value={entry.notes}
                              onChange={(event) =>
                                handleFamilyHistoryEntryChange(
                                  entry._localId,
                                  "notes",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : editForm.familyHistoryEntries.length > 0 ? (
                  <div className="space-y-3">
                    {editForm.familyHistoryEntries.map((entry) => (
                      <div
                        key={entry._localId}
                        className="rounded-xl border border-border/60 bg-gradient-to-br from-white via-white to-[#F4FFFD] p-4 shadow-sm transition-all hover:border-[#00C4B3]/40 hover:shadow-md dark:from-muted dark:via-muted dark:to-muted/70"
                      >
                        <div className="grid gap-3 md:grid-cols-2 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Relation
                            </p>
                            <p className="text-foreground">
                              {entry.relation?.trim() || "—"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Disease
                            </p>
                            <p className="text-foreground">
                              {entry.condition?.trim() || "—"}
                            </p>
                          </div>
                        </div>
                        {entry.notes?.trim() && (
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="font-semibold text-muted-foreground uppercase">
                              Notes
                            </p>
                            <p className="leading-relaxed text-muted-foreground">
                              {entry.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground min-h-[1.5rem]">
                    No family history recorded.
                  </p>
                )}
              </div>

              {/* Previous surgeries entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HospitalIcon className="w-4 h-4 text-[#0ea5e9]" />
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Previous Surgeries
                    </Label>
                  </div>
                  {isHistoryEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPreviousSurgeryEntry}
                    >
                      <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                      Add surgery
                    </Button>
                  )}
                </div>
                {isHistoryEditing ? (
                  editForm.previousSurgeryEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No previous surgeries recorded yet. Use &quot;Add surgery&quot; to capture
                      details.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {editForm.previousSurgeryEntries.map((entry) => (
                        <div
                          key={entry._localId}
                          className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                              Surgery
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-600"
                              onClick={() => handleRemovePreviousSurgeryEntry(entry._localId)}
                              aria-label="Remove surgery entry"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Surgery</Label>
                              <Input
                                placeholder="e.g., Appendectomy"
                                value={entry.surgery}
                                onChange={(event) =>
                                  handlePreviousSurgeryEntryChange(
                                    entry._localId,
                                    "surgery",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Performed On</Label>
                              <Input
                                type="date"
                                value={entry.date}
                                onChange={(event) =>
                                  handlePreviousSurgeryEntryChange(
                                    entry._localId,
                                    "date",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Hospital / Clinic
                              </Label>
                              <Input
                                placeholder="e.g., City Hospital"
                                value={entry.hospital}
                                onChange={(event) =>
                                  handlePreviousSurgeryEntryChange(
                                    entry._localId,
                                    "hospital",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Notes</Label>
                            <Textarea
                              rows={2}
                              placeholder="Intraoperative details, complications, recovery notes..."
                              value={entry.notes}
                              onChange={(event) =>
                                handlePreviousSurgeryEntryChange(
                                  entry._localId,
                                  "notes",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : editForm.previousSurgeryEntries.length > 0 ? (
                  <div className="space-y-3">
                    {editForm.previousSurgeryEntries.map((entry) => (
                      <div
                        key={entry._localId}
                        className="rounded-xl border border-border/60 bg-gradient-to-br from-white via-white to-[#F4FFFD] p-4 shadow-sm transition-all hover:border-[#00C4B3]/40 hover:shadow-md dark:from-muted dark:via-muted dark:to-muted/70"
                      >
                        <div className="grid gap-3 md:grid-cols-3 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Surgery
                            </p>
                            <p className="text-foreground">
                              {entry.surgery?.trim() || "—"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Performed On
                            </p>
                            <p className="text-foreground">
                              {entry.date?.trim() || "—"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Hospital / Clinic
                            </p>
                            <p className="text-foreground">
                              {entry.hospital?.trim() || "—"}
                            </p>
                          </div>
                        </div>
                        {entry.notes?.trim() && (
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="font-semibold text-muted-foreground uppercase">
                              Notes
                            </p>
                            <p className="leading-relaxed text-muted-foreground">
                              {entry.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground min-h-[1.5rem]">
                    No previous surgeries recorded.
                  </p>
                )}
              </div>

              {/* Structured medical history (conditions) */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <ClipboardListIcon className="w-4 h-4 text-[#22c55e]" />
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Medical History
                  </Label>
                </div>
              </div>
              {isHistoryEditing ? (
                <div className="space-y-4">
                  {editForm.medicalHistoryEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
                      <ClipboardListIcon className="h-12 w-12 opacity-40" />
                      <p className="mt-3 text-sm font-medium">
                        No medical history recorded yet.
                      </p>
                      <p className="mt-1 max-w-md text-xs text-muted-foreground">
                        Capture each condition as a structured record so it aligns with the database and audit history.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={handleAddHistoryEntry}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add history entry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editForm.medicalHistoryEntries.map((entry, index) => (
                        <div
                          key={`history-entry-${entry._localId}`}
                          className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-foreground">
                              History Entry {index + 1}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-600"
                              onClick={() => handleRemoveHistoryEntry(entry._localId)}
                              aria-label="Remove history entry"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Title / Condition
                              </Label>
                              <Input
                                placeholder="e.g., Hypertension"
                                value={entry.title ?? ""}
                                onChange={(event) =>
                                  handleHistoryEntryChange(
                                    entry._localId,
                                    "title",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Diagnosis
                              </Label>
                              <Input
                                placeholder="Diagnosis details"
                                value={entry.diagnosis ?? ""}
                                onChange={(event) =>
                                  handleHistoryEntryChange(
                                    entry._localId,
                                    "diagnosis",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Treated By
                              </Label>
                              <Input
                                placeholder="Doctor or clinician"
                                value={entry.treatedBy ?? ""}
                                onChange={(event) =>
                                  handleHistoryEntryChange(
                                    entry._localId,
                                    "treatedBy",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Recorded On
                              </Label>
                              <Input
                                type="date"
                                value={entry.recordedOn ?? ""}
                                onChange={(event) =>
                                  handleHistoryEntryChange(
                                    entry._localId,
                                    "recordedOn",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Notes
                            </Label>
                  <Textarea
                              rows={3}
                              placeholder="Clinical notes, treatment plans, follow-up instructions..."
                              value={entry.notes ?? ""}
                              onChange={(event) =>
                                handleHistoryEntryChange(
                                  entry._localId,
                                  "notes",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={handleAddHistoryEntry}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add another history entry
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Each entry you add here maps directly to the structured medical history stored in the database and will appear in the audit trail.
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
                        <div className="flex-1 space-y-1">
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
                  Medication history
                  <span className="inline-flex items-center justify-center rounded-full bg-[#00C4B3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00C4B3]">
                    {medicationHistory.length}
                  </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isMedicationsEditing
                    ? "Existing prescriptions are shown below. Use the editor to add corrections."
                    : "Every medication recorded for this patient, including past prescriptions."}
                </p>
              </div>
              {canEditPatientProfile && !isGlobalEditMode && (
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
              {isMedicationsEditing ? (
                <>
                  {editForm.currentMedications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
                      <PillIcon className="h-12 w-12 opacity-40" />
                      <p className="mt-3 text-sm font-medium">
                        No medications captured yet.
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Use the button below to add the first prescription for this patient.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editForm.currentMedications.map((med) => {
                        const isPast = Boolean(med.endDate?.trim());
                        return (
                          <div
                            key={`editable-med-${med._localId}`}
                            className="rounded-xl border border-border bg-muted/10 p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs">
                                <Badge
                                  variant="outline"
                                  className={isPast ? "border-amber-300 text-amber-600" : "border-emerald-300 text-emerald-600"}
                                >
                                  {isPast ? "Past" : "Active"}
                                </Badge>
                                {med.isNew && (
                                  <Badge className="bg-[#00C4B3]/15 text-[#00C4B3]" variant="secondary">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-600"
                                onClick={() => handleRemoveMedication(med._localId)}
                                aria-label="Remove medication"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Medication Name
                                </Label>
                                <Input
                                  placeholder="e.g., Metformin"
                                  value={med.name ?? ""}
                                  onChange={(event) =>
                                    handleMedicationFieldChange(
                                      med._localId,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Dosage</Label>
                                <Input
                                  placeholder="500 mg"
                                  value={med.dosage ?? ""}
                                  onChange={(event) =>
                                    handleMedicationFieldChange(
                                      med._localId,
                                      "dosage",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Frequency</Label>
                                <Input
                                  placeholder="Twice daily"
                                  value={med.frequency ?? ""}
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
                                  value={med.duration ?? ""}
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

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Start Date</Label>
                                <Input
                                  type="date"
                                  value={med.startDate ?? ""}
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
                                  value={med.endDate ?? ""}
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

                            <div className="mt-3 space-y-1">
                              <Label className="text-xs text-muted-foreground">Instructions</Label>
                              <Textarea
                                rows={2}
                                placeholder="Take with meals"
                                value={med.instructions ?? ""}
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
                        );
                      })}
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
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-4 rounded-xl border border-[#00C4B3]/15 bg-[#F7FFFE] p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00C4B3]/10 text-[#00C4B3]">
                          <PillIcon className="h-4 w-4" />
                        </span>
                        <h3 className="font-semibold text-foreground">Patient medication history</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Review medicines prescribed across all recorded visits.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-[#00C4B3]/30 text-[#008f84] hover:bg-[#00C4B3]/10"
                      onClick={focusMedicationHistory}
                    >
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Open prescriptions
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <p className="text-2xl font-semibold tabular-nums">{medicationHistory.length}</p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">Unique medicines</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <p className="text-2xl font-semibold tabular-nums">{medicationPrescriptionCount}</p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">Total prescriptions</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <p className="text-2xl font-semibold tabular-nums">{savedMedications.length}</p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">Medication line items</p>
                    </div>
                  </div>

                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={medicationSearch}
                      onChange={(event) => setMedicationSearch(event.target.value)}
                      placeholder='Search medication history, e.g. "Metformin"'
                      className="pl-9"
                      aria-label="Search medication history"
                    />
                  </div>

                  <div ref={medicationHistoryRef} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-sm font-semibold text-foreground">All medicines</p>
                      <p className="text-xs text-muted-foreground">
                        {filteredMedicationHistory.length} of {medicationHistory.length} · most recent first
                      </p>
                    </div>

                  {medicationHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
                      <PillIcon className="h-12 w-12 opacity-40" />
                      <p className="mt-3 text-sm font-medium">
                        No medications recorded for this patient.
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        When a doctor adds a prescription, it will appear here automatically.
                      </p>
                    </div>
                  ) : filteredMedicationHistory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 py-10 text-center text-sm text-muted-foreground">
                      No medications match “{medicationSearch}”.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                      {filteredMedicationHistory.map(({ key, name, entries, latest, latestTimestamp }) => {
                        const latestDate =
                          latestTimestamp > 0
                            ? new Date(latestTimestamp).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Date not recorded";
                        const doseVariants = new Set(
                          entries.map((entry) => `${entry.dosage || ""}|${entry.frequency || ""}`),
                        ).size;
                        const isActive = entries.some((entry) => {
                          if (!entry.endDate) return true;
                          return new Date(entry.endDate).getTime() >= today.getTime();
                        });

                        return (
                          <div
                            key={key}
                            className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 last:border-0 md:flex-row md:items-center"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00C4B3]/10 text-[#00C4B3]">
                              <PillIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">{name}</p>
                                <Badge variant="secondary" className="text-[10px]">
                                  {entries.length} {entries.length === 1 ? "prescribed" : "prescriptions"}
                                </Badge>
                                {doseVariants > 1 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {doseVariants} dose variants
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Most recent: {latest.dosage || "Dosage not specified"}
                                {latest.frequency ? ` · ${latest.frequency}` : ""}
                                {latest.duration ? ` · ${latest.duration}` : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground md:text-right">
                              <Clock3Icon className="h-3.5 w-3.5" />
                              <div>
                                <p className="font-medium text-foreground">{isActive ? "Active" : "Past"}</p>
                                <p>Last: {latestDate}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="lab-results" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConicalIcon className="w-5 h-5 text-[#00C4B3]" />
                Lab Results
              </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Laboratory test results organized by month
                </p>
              </div>
              <input
                ref={labUploadInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleLabPdfSelected}
              />
              <Button
                size="sm"
                type="button"
                onClick={handleLabUploadClick}
                disabled={labUploadLoading || !patient?._id}
                className="bg-[#00C4B3] hover:bg-[#009c8f] text-white"
              >
                {labUploadLoading ? (
                  <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <PlusIcon className="w-4 h-4 mr-2" />
                )}
                Upload Report
              </Button>
            </CardHeader>
            <CardContent>
              {labReports.length === 0 && s3Reports.length === 0 ? (
                <div className="text-center py-10">
                  <FlaskConicalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No lab results available for this patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* S3 Reports Section */}
                  {s3Reports.length > 0 && (
                    <Accordion type="multiple" className="space-y-4">
                      {groupedS3Reports.map((group) => (
                        <AccordionItem
                          key={`s3-${group.label}`}
                          value={`s3-${group.label}`}
                          className="rounded-2xl border border-border bg-card/60 px-4"
                        >
                          <AccordionTrigger className="px-0 hover:no-underline">
                            <div className="flex w-full items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C4B3]/10">
                                  <FlaskConicalIcon className="h-5 w-5 text-[#00C4B3]" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-foreground">{group.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {group.reports.length} uploaded report
                                    {group.reports.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {group.reports.map((report) => (
                              <div
                                key={report._id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-background/70 px-4 py-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {report.documentName}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {new Date(
                                      report.parsedLabReport?.reportedDate ||
                                        report.parsedLabReport?.collectedDate ||
                                        report.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                                  onClick={() => handleViewS3Report(report)}
                                >
                                  <FileTextIcon className="w-4 h-4 mr-2" />
                                  View Report
                                </Button>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                  {/* Regular Lab Reports Section */}
                  {labReports.length > 0 && (
                    <Accordion type="multiple" className="space-y-4">
                      {groupedLabReports.map((group) => (
                        <AccordionItem
                          key={group.label}
                          value={group.label}
                          className="rounded-2xl border border-border bg-card/60 px-4"
                        >
                          <AccordionTrigger className="px-0 hover:no-underline">
                            <div className="flex w-full items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C4B3]/10 text-[#00C4B3]">
                                  <FlaskConicalIcon className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-base font-semibold text-foreground">
                                    {group.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {group.reports.length}{" "}
                                    {group.reports.length === 1 ? "report" : "reports"} ·{" "}
                                    {group.totalTests} {group.totalTests === 1 ? "test" : "tests"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {group.abnormalTests > 0 ? (
                                  <Badge className="bg-red-100 text-red-700 border-red-200">
                                    {group.abnormalTests} abnormal
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    All normal
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-0">
                            <div className="space-y-2">
                              {group.reports.map((report) => (
                                <div
                                  key={report._id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-background/70 px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {report.reportType}
                                    </p>
                                    {report.notes && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        <span className="font-medium text-foreground">
                                          {report.orderedBy || report.reviewedBy || report.doctorId || "Doctor"}:
                                        </span>{" "}
                                        {report.notes}
                                      </p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground">
                                      {formatDisplayDate(report.collectedDate)} ·{" "}
                                      {formatDisplayDate(report.reportedDate)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                                    onClick={() => handleViewLabReport(report)}
                                  >
                                    <FileTextIcon className="w-4 h-4 mr-2" />
                                    View Report
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6 mt-6">
          {/* Add Appointment Button - Appears First */}
          <Card className="border-border shadow-sm border-dashed">
            <CardContent className="pt-6">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                onClick={() => {
                  if (!patientId) return;
                  
                  // Determine the appointments page based on user role
                  let appointmentsPath = "/receptionist-appointments";
                  if (user?.role === "doctor") {
                    appointmentsPath = "/doctor-appointments";
                  } else if (user?.role === "admin") {
                    appointmentsPath = "/admin-appointments";
                  }
                  
                  // Navigate to appointments page with patient ID as query parameter
                  navigate(`${appointmentsPath}?patientId=${encodeURIComponent(patientId)}`);
                }}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Add Appointment
              </Button>
            </CardContent>
          </Card>

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
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {appointment.reason || appointment.type || "Consultation"}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Date:</span> {appointment.date ? new Date(appointment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Doctor:</span> {appointment.doctorName || "Doctor"}
                          </p>
                          {appointment.time && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Time:</span> {appointment.time}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {appointment.reason && appointment.type && appointment.reason !== appointment.type && (
                          <Badge variant="outline" className="text-xs">
                            {appointment.type}
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
                        <Button
                          size="sm"
                          className="text-sm h-9 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md font-medium"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setAppointmentDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        {/* Edit button - only show if appointment was created today */}
                        {isAppointmentCreatedToday(appointment) && canEditPatientProfile && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              // Navigate to appointments page with appointment ID for editing
                              let appointmentsPath = "/receptionist-appointments";
                              if (user?.role === "doctor") {
                                appointmentsPath = "/doctor-appointments";
                              } else if (user?.role === "admin") {
                                appointmentsPath = "/admin-appointments";
                              }
                              navigate(`${appointmentsPath}?patientId=${encodeURIComponent(patientId || "")}&appointmentId=${encodeURIComponent(appointment._id)}`);
                            }}
                          >
                            Edit
                          </Button>
                        )}
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {pastAppointments.length} recorded
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pastAppointments.length > 0 ? (
                <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
                  <Accordion type="multiple" className="space-y-3">
                    {groupedPastAppointments.map((group) => (
                      <AccordionItem
                        key={`past-month-${group.label}`}
                        value={`past-month-${group.label}`}
                        className="rounded-xl border border-border px-3"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex w-full items-center justify-between gap-2 pr-2">
                            <span className="text-sm font-semibold">{group.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {group.appointments.length} visit
                              {group.appointments.length === 1 ? "" : "s"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-3">
                          {group.appointments.map((appointment) => {
                    const appointmentKey = appointment._id || appointment.appointmentId;
                    const mergedClinicalNotes =
                      appointment.clinicalNotes && appointment.clinicalNotes.length > 0
                        ? appointment.clinicalNotes
                        : appointmentKey
                        ? clinicalNotesByAppointment.get(appointmentKey) || []
                        : [];

                    const hasDetails =
                      appointment.prescription ||
                      appointment.prescriptionFileUrl ||
                      appointment.tests ||
                      appointment.prescribedTest ||
                      appointment.diagnosis ||
                      appointment.treatmentPlan ||
                      appointment.followUpInstructions ||
                      appointment.detailedNotes ||
                      appointment.aiRecommendations ||
                      appointment.structuredNotes ||
                      appointment.consultationSummary ||
                      (mergedClinicalNotes && mergedClinicalNotes.length > 0);
                    
                    const hasPatientUpdates = appointment.structuredNotes?.medications?.length > 0 ||
                      appointment.structuredNotes?.allergies?.length > 0 ||
                      appointment.structuredNotes?.chiefComplaint;
                    const appointmentValue = `appointment-${appointment._id}`;
                    
                    return (
                    <Accordion 
                      key={`past-${appointment._id}`} 
                      type="single" 
                      collapsible 
                      className="w-full"
                      defaultValue={undefined}
                    >
                      <AccordionItem value={appointmentValue} className="border border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/20 dark:bg-purple-950/10">
                        <div className="px-4 py-3">
                          <AccordionTrigger className="hover:no-underline [&>svg]:hidden">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full mr-4">
                              <div className="text-left flex-1">
                                <p className="text-sm font-semibold text-foreground mb-1">
                                  {appointment.reason || appointment.type || "Consultation"}
                                </p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Date:</span> {appointment.date ? new Date(appointment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Doctor:</span> {appointment.doctorName || "Doctor"}
                                  </p>
                                  {appointment.time && (
                                    <p className="text-xs text-muted-foreground">
                                      <span className="font-medium">Time:</span> {appointment.time}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Highlights - visible even when collapsed */}
                                {hasDetails && (
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {appointment.diagnosis && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                        <FileTextIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <span className="text-xs font-medium text-red-700 dark:text-red-400">Diagnosis</span>
                                      </div>
                                    )}
                                    {(appointment.prescription || appointment.prescriptionFileUrl) && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                                        <PillIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                                          {appointment.prescriptionFileUrl ? "Prescription File" : "Prescription"}
                                        </span>
                                      </div>
                                    )}
                                    {(appointment.tests || appointment.prescribedTest) && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                        <FlaskConicalIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Tests</span>
                                      </div>
                                    )}
                                    {appointment.treatmentPlan && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                        <FileTextIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Treatment</span>
                                      </div>
                                    )}
                                    {appointment.aiRecommendations && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                                        <SparklesIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">AI Analysis</span>
                                      </div>
                                    )}
                                    {mergedClinicalNotes && mergedClinicalNotes.length > 0 && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                        <FileTextIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                          {mergedClinicalNotes.length} Note
                                          {mergedClinicalNotes.length > 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    )}
                                    {appointment.structuredNotes && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#00C4B3]/10 border border-[#00C4B3]/30">
                                        <SparklesIcon className="w-3 h-3 text-[#00C4B3]" />
                                        <span className="text-xs font-medium text-[#00C4B3]">AI Summary</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="bg-muted text-xs text-muted-foreground capitalize">
                                  {appointment.status}
                                </Badge>
                                {appointment.reason && appointment.reason !== (appointment.type || "Consultation") && (
                                  <Badge variant="outline" className="text-xs">
                                    {appointment.reason}
                                  </Badge>
                                )}
                                {hasDetails && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                                    Details Available
                                  </Badge>
                                )}
                                {hasPatientUpdates && (
                                  <Badge variant="outline" className="text-xs bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/30">
                                    <SparklesIcon className="w-3 h-3 mr-1" />
                                    Profile Updated
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            {/* Diagnosis Section */}
                            {appointment.diagnosis ? (
                              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileTextIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                                    Diagnosis
                                  </p>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {appointment.diagnosis}
                                </p>
                              </div>
                            ) : null}

                            {/* Extracted Medications Section */}
                            {appointment.prescriptionMedications && appointment.prescriptionMedications.length > 0 && (
                              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <PillIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                    Extracted Medications
                                  </p>
                                  <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                                    {appointment.prescriptionMedications.length}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  {appointment.prescriptionMedications.map((med: any, index: number) => (
                                    <div
                                      key={index}
                                      className="p-2 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50"
                                    >
                                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        {med.name}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                                        {med.dosage && (
                                          <div>
                                            <span className="font-medium">Dosage:</span> {med.dosage}
                                          </div>
                                        )}
                                        {med.frequency && (
                                          <div>
                                            <span className="font-medium">Frequency:</span> {med.frequency}
                                          </div>
                                        )}
                                        {med.duration && (
                                          <div>
                                            <span className="font-medium">Duration:</span> {med.duration}
                                          </div>
                                        )}
                                        {med.instructions && (
                                          <div className="sm:col-span-2">
                                            <span className="font-medium">Instructions:</span> {med.instructions}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Prescription Section */}
                            {(appointment.prescription || appointment.prescriptionFileUrl) ? (
                              <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileTextIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                                    Prescription
                                  </p>
                                </div>
                                {appointment.prescription && (
                                  <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
                                    {appointment.prescription}
                                  </p>
                                )}
                                {appointment.prescriptionFileUrl && (
                                  <div className="mt-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const appointmentId = appointment._id || appointment.appointmentId;
                                          if (!appointmentId) {
                                            toast({
                                              title: "Error",
                                              description: "Appointment ID is missing",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          const response = await get(
                                            `/api/appointments/${appointmentId}/prescription/presigned-url`
                                          );
                                          if (response.success && response.data?.presignedUrl) {
                                            window.open(response.data.presignedUrl, "_blank", "noopener,noreferrer");
                                          } else {
                                            toast({
                                              title: "Error",
                                              description: response.message || "Failed to generate file access URL",
                                              variant: "destructive",
                                            });
                                          }
                                        } catch (error: any) {
                                          toast({
                                            title: "Error",
                                            description: error?.message || "Failed to access file",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-md border border-purple-300 dark:border-purple-700 transition-colors"
                                    >
                                      <FileTextIcon className="w-4 h-4" />
                                      {appointment.prescriptionFileName || "View Prescription File"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Prescribed Tests Section */}
                            {(appointment.prescribedTest || appointment.tests) ? (
                              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FlaskConicalIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    Prescribed Tests
                                  </p>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {appointment.prescribedTest || appointment.tests}
                                </p>
                              </div>
                            ) : null}

                            {/* Treatment Plan Section */}
                            {appointment.treatmentPlan ? (
                              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileTextIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                                    Treatment Plan
                                  </p>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {appointment.treatmentPlan}
                                </p>
                              </div>
                            ) : null}

                            {/* Follow-up Instructions Section */}
                            {appointment.followUpInstructions ? (
                              <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                    Follow-up Instructions
                                  </p>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {appointment.followUpInstructions}
                                </p>
                              </div>
                            ) : null}

                            {/* Detailed Notes Section */}
                            {appointment.detailedNotes ? (
                              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileTextIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-400">
                                    Detailed Notes
                                  </p>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {appointment.detailedNotes}
                                </p>
                              </div>
                            ) : null}

                            {/* AI Recommendations Section */}
                            {appointment.aiRecommendations ? (
                              <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                    AI Health Analysis
                                  </p>
                                </div>
                                {typeof appointment.aiRecommendations === 'string' ? (
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {appointment.aiRecommendations}
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {/* Risk Assessment */}
                                    {appointment.aiRecommendations.riskAssessment && (
                                      <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                                          Risk Assessment
                                        </p>
                                        <div className="space-y-1">
                                          {appointment.aiRecommendations.riskAssessment.level && (
                                            <p className="text-xs text-foreground">
                                              <span className="font-medium">Level:</span> {appointment.aiRecommendations.riskAssessment.level.toUpperCase()}
                                            </p>
                                          )}
                                          {appointment.aiRecommendations.riskAssessment.successRate && (
                                            <p className="text-xs text-foreground">
                                              <span className="font-medium">Success Rate:</span> {appointment.aiRecommendations.riskAssessment.successRate}
                                            </p>
                                          )}
                                          {appointment.aiRecommendations.riskAssessment.similarCases !== undefined && (
                                            <p className="text-xs text-foreground">
                                              <span className="font-medium">Based on:</span> {appointment.aiRecommendations.riskAssessment.similarCases} similar cases
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {/* Key Findings */}
                                    {appointment.aiRecommendations.keyFindings && appointment.aiRecommendations.keyFindings.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                                          Key Findings
                                        </p>
                                        <ul className="space-y-2">
                                          {appointment.aiRecommendations.keyFindings.map((finding: string, index: number) => (
                                            <li key={index} className="text-xs text-foreground flex items-start gap-2">
                                              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
                                              <span>{finding}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {/* Recommendations */}
                                    {appointment.aiRecommendations.recommendations && appointment.aiRecommendations.recommendations.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                                          AI Recommendations
                                        </p>
                                        <ul className="space-y-2">
                                          {appointment.aiRecommendations.recommendations.map((rec: string, index: number) => (
                                            <li key={index} className="text-xs text-foreground flex items-start gap-2">
                                              <CheckCircleIcon className="w-3 h-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                              <span>{rec}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Clinical Notes Section */}
                            {mergedClinicalNotes && mergedClinicalNotes.length > 0 ? (
                              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                    Clinical Notes
                                  </p>
                                </div>
                                <div className="space-y-3">
                                  {mergedClinicalNotes.map((note) => (
                                    <div key={note._id} className="border-l-2 border-blue-300 dark:border-blue-700 pl-3">
                                      {note.diagnosis && (
                                        <p className="text-xs font-medium text-foreground mb-1">
                                          Diagnosis: <span className="font-normal">{note.diagnosis}</span>
                                        </p>
                                      )}
                                      {note.note && (
                                        <p className="text-sm text-foreground mb-1 whitespace-pre-wrap">
                                          {note.note}
                                        </p>
                                      )}
                                      {note.treatment && (
                                        <p className="text-xs text-muted-foreground">
                                          <span className="font-medium">Treatment:</span> {note.treatment}
                                        </p>
                                      )}
                                      {note.followUp && (
                                        <p className="text-xs text-muted-foreground">
                                          <span className="font-medium">Follow-up:</span> {note.followUp}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(note.createdAt).toLocaleDateString()} • {note.doctorName || "Doctor"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {/* No details message */}
                            {/* View Details Button - Always show */}
                            <div className="flex justify-center py-3">
                              <Button
                                size="lg"
                                className="text-sm h-10 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md font-medium"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setAppointmentDialogOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
                Manage insurance policies linked with this patient's profile.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-gradient-to-r from-[#FF8008] via-[#FC7334] to-[#03C988] text-white p-4 space-y-4 shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">
                        {insuranceProviderName}
                  </p>
                      <p className="text-xl font-semibold leading-tight">{insurancePlanName}</p>
                      <p className="text-[11px] opacity-80">
                        {activeInsuranceRecord ? "Linked insurance profile" : "Plan details pending update"}
                  </p>
                </div>
                    <Badge className="bg-white/20 text-white border-white/40 text-[10px] px-2 py-0.5">
                      {insuranceStatus}
                  </Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 text-[11px] font-medium rounded-xl bg-white/10 p-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-70">
                        Card Number
                      </p>
                      <p className="text-base tracking-wide">
                        {insuranceCardNumberDisplay}
                  </p>
                </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider opacity-70">
                        Member
                      </p>
                      <p className="text-base">{insuranceMemberName}</p>
              </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase opacity-70">Valid From</p>
                      <p className="font-semibold">{insuranceValidFromLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-70">Valid Until</p>
                      <p className="font-semibold">{insuranceValidUntilLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs opacity-90">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {familyCoverageLabel}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Coverage Summary
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-emerald-50 p-2.5 min-h-[70px]">
                      <p className="text-[11px] text-emerald-700">Total Coverage</p>
                      <p className="text-sm font-semibold text-emerald-900 mt-1">
                        {coverageSummary.total}
                      </p>
                    </div>
                    <div className="rounded-xl bg-orange-50 p-2.5 min-h-[70px]">
                      <p className="text-[11px] text-orange-700">Used</p>
                      <p className="text-sm font-semibold text-orange-900 mt-1">
                        {coverageSummary.used}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-100/80 p-2.5 min-h-[70px]">
                      <p className="text-[11px] text-emerald-700">Remaining</p>
                      <p className="text-sm font-semibold text-emerald-900 mt-1">
                        {coverageSummary.remaining}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Coverage Utilization</span>
                      <span>{Math.round(coverageProgress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF8008] via-[#FC7334] to-[#03C988]"
                        style={{ width: `${coverageProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted/30 p-2.5">
                      <p className="text-xs text-muted-foreground">Days Remaining</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                        {daysRemainingLabel}
                    </p>
                  </div>
                    <div className="rounded-xl bg-muted/30 p-2.5">
                      <p className="text-xs text-muted-foreground">Total Claims</p>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {insuranceClaims.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base">Insurance Records</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Track every policy associated with this patient.
                    </p>
                  </div>
                  {canManageInsurance && (
                    <Button size="sm" onClick={() => openInsuranceDialog("create")}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Insurance
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {hasInsuranceRecords ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plan</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Policy #</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Coverage</TableHead>
                            <TableHead>Validity</TableHead>
                            {canManageInsurance && <TableHead className="text-right">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {insuranceRecords.map((record) => {
                            const validityLabel =
                              record.validFrom || record.validUntil
                                ? `${record.validFrom ? formatDisplayDate(record.validFrom, "—") : "—"} → ${
                                    record.validUntil ? formatDisplayDate(record.validUntil, "—") : "—"
                                  }`
                                : "—";
                            return (
                              <TableRow
                                key={record._id}
                                onClick={() => setSelectedInsuranceId(record._id)}
                                className={`cursor-pointer ${
                                  selectedInsuranceId === record._id ? "bg-muted/50" : ""
                                }`}
                              >
                                <TableCell className="font-semibold">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span>{record.planName || "—"}</span>
                                      {record.isPrimary && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] border-[#00C4B3] text-[#00C4B3] bg-[#00C4B3]/10"
                                        >
                                          Primary
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                      {record.memberName || insuranceMemberName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{record.provider}</TableCell>
                                <TableCell>{record.policyNumber || record.cardNumber || "—"}</TableCell>
                                <TableCell>{record.status || "—"}</TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium">
                                    {record.coverageLimit || "—"}
                                  </div>
                                  {record.coverageUsed && (
                                    <p className="text-[11px] text-muted-foreground">Used: {record.coverageUsed}</p>
                                  )}
                                </TableCell>
                                <TableCell>{validityLabel}</TableCell>
                                {canManageInsurance && (
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openInsuranceDialog("edit", record);
                                        }}
                                        className="text-[#00C4B3] border-[#00C4B3] hover:bg-[#00C4B3] hover:text-white"
                                      >
                                        <EditIcon className="w-4 h-4 mr-1" />
                                        Update
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleDeleteInsurance(record._id);
                                        }}
                                        disabled={deletingInsuranceId === record._id}
                                      >
                                        {deletingInsuranceId === record._id ? (
                                          <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                          <Trash2Icon className="h-4 w-4 mr-1" />
                                        )}
                                        Delete
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground space-y-2">
                      <p>No insurance records yet.</p>
                      {canManageInsurance && (
                        <Button variant="outline" size="sm" onClick={() => openInsuranceDialog("create")}>
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add insurance
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-2.5 flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-[#00C4B3]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Policy Number</p>
                    <p className="text-sm font-semibold tracking-wide">
                      {insurancePolicyNumberDisplay}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
                  <p>{insuranceNotesDisplay}</p>
                  <p>
                    For assistance with claims or coverage updates, email{" "}
                    <a href="mailto:support@alertedai.care" className="text-[#00C4B3] underline">
                      support@alertedai.care
                    </a>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet2Icon className="w-5 h-5 text-[#00C4B3]" />
                  Coverage Benefits
                </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBenefitsDialogOpen(true)}
                    className="text-[#00C4B3] border-[#00C4B3]/20 hover:bg-[#00C4B3]/10"
                  >
                    <FileTextIcon className="w-4 h-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {insuranceBenefits
                    .filter((benefit) => selectedBenefits.has(benefit.title))
                    .map((benefit) => (
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
              <p>{insuranceNotesDisplay}</p>
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

      <Dialog open={isInsuranceDialogOpen} onOpenChange={(open) => (open ? setIsInsuranceDialogOpen(true) : closeInsuranceDialog())}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleInsuranceFormSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {insuranceDialogMode === "create" ? "Add insurance" : "Update insurance"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insurance-provider">Provider</Label>
                <Input
                  id="insurance-provider"
                  value={insuranceForm.provider}
                  onChange={(event) => handleInsuranceFieldChange("provider", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance-plan">Plan name</Label>
                <Input
                  id="insurance-plan"
                  value={insuranceForm.planName}
                  onChange={(event) => handleInsuranceFieldChange("planName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance-policy">Policy number</Label>
                <Input
                  id="insurance-policy"
                  value={insuranceForm.policyNumber}
                  onChange={(event) => handleInsuranceFieldChange("policyNumber", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance-card">Card number</Label>
                <Input
                  id="insurance-card"
                  value={insuranceForm.cardNumber}
                  onChange={(event) => handleInsuranceFieldChange("cardNumber", event.target.value)}
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance-member">Member name</Label>
                <Input
                  id="insurance-member"
                  value={insuranceForm.memberName}
                  onChange={(event) => handleInsuranceFieldChange("memberName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={insuranceForm.status}
                  onValueChange={(value) => handleInsuranceFieldChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverage-limit">Total coverage</Label>
                <Input
                  id="coverage-limit"
                  value={insuranceForm.coverageLimit}
                  onChange={(event) => handleInsuranceFieldChange("coverageLimit", event.target.value)}
                  placeholder="₹5,00,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverage-used">Used amount</Label>
                <Input
                  id="coverage-used"
                  value={insuranceForm.coverageUsed}
                  onChange={(event) => handleInsuranceFieldChange("coverageUsed", event.target.value)}
                  placeholder="₹45,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverage-remaining">Remaining amount</Label>
                <Input
                  id="coverage-remaining"
                  value={insuranceForm.coverageRemaining}
                  onChange={(event) => handleInsuranceFieldChange("coverageRemaining", event.target.value)}
                  placeholder="₹4,55,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family-covered">Family members covered</Label>
                <Input
                  id="family-covered"
                  type="number"
                  value={insuranceForm.familyMembersCovered}
                  onChange={(event) => handleInsuranceFieldChange("familyMembersCovered", event.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-from">Valid from</Label>
                <Input
                  id="valid-from"
                  type="date"
                  value={insuranceForm.validFrom}
                  onChange={(event) => handleInsuranceFieldChange("validFrom", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={insuranceForm.validUntil}
                  onChange={(event) => handleInsuranceFieldChange("validUntil", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance-notes">Notes</Label>
              <Textarea
                id="insurance-notes"
                rows={3}
                value={insuranceForm.notes}
                onChange={(event) => handleInsuranceFieldChange("notes", event.target.value)}
                placeholder="Add any policy specific notes"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Coverage Benefits</Label>
              <p className="text-xs text-muted-foreground">
                Select the coverage benefits available with this insurance policy.
              </p>
              <div className="grid gap-3 max-h-[300px] overflow-y-auto p-3 border border-border/60 rounded-lg">
                {insuranceBenefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="flex items-start space-x-3 rounded-lg border border-border/40 p-2 hover:bg-muted/30"
                  >
                    <Checkbox
                      id={`insurance-benefit-${benefit.title}`}
                      checked={insuranceFormBenefits.has(benefit.title)}
                      onCheckedChange={(checked) => {
                        setInsuranceFormBenefits((prev) => {
                          const newSet = new Set(prev);
                          if (checked) {
                            newSet.add(benefit.title);
                          } else {
                            newSet.delete(benefit.title);
                          }
                          return newSet;
                        });
                      }}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`insurance-benefit-${benefit.title}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <benefit.icon className="w-4 h-4 text-[#00C4B3]" />
                        <p className="font-semibold text-sm">{benefit.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {benefit.description}
                      </p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 p-3">
              <div>
                <p className="text-sm font-semibold">Primary plan</p>
                <p className="text-xs text-muted-foreground">
                  Primary plans drive the insurance overview card.
                </p>
              </div>
              <Switch
                checked={insuranceForm.isPrimary}
                onCheckedChange={(checked) => handleInsuranceFieldChange("isPrimary", checked)}
              />
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeInsuranceDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingInsurance}>
                {isSavingInsurance ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    Saving
                  </>
                ) : insuranceDialogMode === "create" ? (
                  "Add insurance"
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coverage Benefits Management Dialog */}
      <Dialog open={isBenefitsDialogOpen} onOpenChange={setIsBenefitsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Coverage Benefits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select which coverage benefits to display in the Coverage Benefits section.
            </p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {insuranceBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start space-x-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`benefit-${benefit.title}`}
                    checked={selectedBenefits.has(benefit.title)}
                    onCheckedChange={(checked) => {
                      setSelectedBenefits((prev) => {
                        const newSet = new Set(prev);
                        if (checked) {
                          newSet.add(benefit.title);
                        } else {
                          newSet.delete(benefit.title);
                        }
                        return newSet;
                      });
                    }}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`benefit-${benefit.title}`}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <benefit.icon className="w-4 h-4 text-[#00C4B3]" />
                      <p className="font-semibold text-sm">{benefit.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {benefit.description}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBenefitsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const activeRecord = insuranceRecords.find((r) => r.isPrimary) || insuranceRecords[0];
                if (!activeRecord || !resolvedCoveragePatientId) {
                  toast({
                    variant: "destructive",
                    title: "No insurance record",
                    description: "Please add an insurance record first.",
                  });
                  return;
                }

                const policyNumber = activeRecord.policyNumber || activeRecord.cardNumber;
                if (!policyNumber) {
                  toast({
                    variant: "destructive",
                    title: "Invalid policy number",
                    description: "Policy number is required to save coverage benefits.",
                  });
                  return;
                }

                  try {
                  setIsSavingInsurance(true);
                  const benefitsArray = Array.from(selectedBenefits);
                  
                  // Try to fetch existing coverage
                  let existingCoverage: InsuranceCoverage | null = null;
                  try {
                    const coverage = await fetchInsuranceCoverage(resolvedCoveragePatientId, policyNumber);
                    existingCoverage = Array.isArray(coverage) ? coverage[0] : coverage;
                  } catch (err) {
                    // Coverage doesn't exist yet, will create new
                  }

                  if (existingCoverage?._id) {
                    // Update existing coverage
                    await updateInsuranceCoverage(existingCoverage._id, {
                      selectedBenefits: benefitsArray,
                    });
                  } else {
                    // Create new coverage
                    await createInsuranceCoverage({
                      patientId: resolvedCoveragePatientId,
                      policyNumber,
                      selectedBenefits: benefitsArray,
                    });
                  }

                  toast({
                    title: "Benefits updated",
                    description: "Coverage benefits have been saved.",
                  });
                  setIsBenefitsDialogOpen(false);
                } catch (err) {
                  toast({
                    variant: "destructive",
                    title: "Failed to save benefits",
                    description: err instanceof Error ? err.message : "Please try again.",
                  });
                } finally {
                  setIsSavingInsurance(false);
                }
              }}
              disabled={isSavingInsurance}
            >
              {isSavingInsurance ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Saving
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        appointment={selectedAppointment}
      />

    </div>
  );
}

