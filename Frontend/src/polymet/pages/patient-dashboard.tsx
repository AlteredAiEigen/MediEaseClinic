import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ActivityIcon,
  HeartPulseIcon,
  ThermometerIcon,
  MessageSquareIcon,
  Loader2Icon,
  SendIcon,
  DropletIcon,
  WindIcon,
  ShieldCheckIcon,
  Wallet2Icon,
  CreditCardIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  IndianRupeeIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { get } from "@/lib/api-client";
import {
  getPatientWhatsAppMessages,
  sendWhatsAppMessage,
  type WhatsAppMessage,
} from "@/lib/api/whatsapp";
import {
  fetchPatientInsurances,
  createPatientInsurance,
  updatePatientInsurance,
  deletePatientInsurance,
  PatientInsuranceRecord,
  PatientInsurancePayload,
} from "@/lib/api/patient-insurance";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { HospitalIcon } from "lucide-react";

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
  age?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  emergencyContact?: string | {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  emergencyContactPhone?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
    bloodGlucose?: string;
    respiratoryRate?: string;
  };
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

export function PatientDashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<PatientVitals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [insuranceRecords, setInsuranceRecords] = useState<PatientInsuranceRecord[]>([]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string | null>(null);
  const [lastVisitDisplay, setLastVisitDisplay] = useState<string | null>(null);
  const [isInsuranceDialogOpen, setIsInsuranceDialogOpen] = useState(false);
  const [insuranceDialogMode, setInsuranceDialogMode] = useState<"create" | "edit">("create");
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [isSavingInsurance, setIsSavingInsurance] = useState(false);
  const [deletingInsuranceId, setDeletingInsuranceId] = useState<string | null>(null);
  const [insuranceForm, setInsuranceForm] = useState({
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
  });
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
      icon: ActivityIcon,
    },
    {
      title: "Medications",
      description: "Covers medicines and consumables during visit",
      icon: HeartPulseIcon,
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

  const canManageInsurance = useMemo(() => {
    return user?.role === "admin" || user?.role === "doctor" || user?.role === "receptionist";
  }, [user]);

  // Fetch patient data (no consent check needed for dashboard view)
  useEffect(() => {
    if (!patientId) return;

    const fetchPatient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use skip_consent parameter to bypass consent check for dashboard view
        const response = await get<{ patient: Patient }>(
          `/api/patients/${patientId}?skip_consent=true`
        );
        
        // Handle different possible response structures
        const patientData = response.data?.patient || response.data?.data || response.data;
        
        if (response.success && patientData) {
          setPatient(patientData as Patient);
        } else {
          setError(response.message || "Failed to load patient");
        }
      } catch (err: any) {
        console.error("Failed to load patient:", err);
        // Try alternative endpoint if first fails
        try {
          const altResponse = await get<{ patient: Patient }>(
            `/api/patients/patient-id/${patientId}?skip_consent=true`
          );
          const patientData = altResponse.data?.patient || altResponse.data?.data || altResponse.data;
          if (altResponse.success && patientData) {
            setPatient(patientData as Patient);
          } else {
            setError(altResponse.message || "Failed to load patient");
          }
        } catch (altErr) {
          setError(err instanceof Error ? err.message : "Failed to load patient");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  // Fetch vitals
  useEffect(() => {
    if (!patientId) return;

    const fetchVitals = async () => {
      try {
        const response = await get<PatientVitals[]>(
          `/api/patient-vitals/${patientId}?limit=10`
        );
        if (response.success && Array.isArray(response.data)) {
          setVitals(response.data);
        }
      } catch (err) {
        console.warn("Failed to fetch vitals:", err);
      }
    };

    fetchVitals();
  }, [patientId]);

  // Fetch insurance records
  useEffect(() => {
    if (!patientId) return;

    const fetchInsurance = async () => {
      try {
        const insurances = await fetchPatientInsurances(patientId);
        setInsuranceRecords(insurances);
      } catch (err) {
        console.error("Failed to load insurance:", err);
      }
    };

    fetchInsurance();
  }, [patientId]);

  // Fetch last visit
  useEffect(() => {
    const targetPatientId = patient?._id || patientId;
    if (!targetPatientId) {
      setLastVisitDisplay(null);
      return;
    }

    const fetchLastVisit = async () => {
      try {
        const response = await get<any>(
          `/api/appointments?patient_id=${targetPatientId}&limit=50`
        );
        if (!response.success) {
          setLastVisitDisplay(null);
          return;
        }

        const extractList = <T,>(rawData: any): T[] => {
          if (Array.isArray(rawData)) {
            return rawData as T[];
          }
          if (rawData && typeof rawData === "object") {
            if (Array.isArray(rawData.data)) {
              return rawData.data as T[];
            }
            if (Array.isArray(rawData.items)) {
              return rawData.items as T[];
            }
            if (Array.isArray(rawData.results)) {
              return rawData.results as T[];
            }
          }
          return [];
        };

        const rawAppointments = extractList<any>(response.data);
        if (!rawAppointments.length) {
          setLastVisitDisplay(null);
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
      } catch (err) {
        console.warn("Failed to fetch last visit for patient", targetPatientId, err);
        setLastVisitDisplay(null);
      }
    };

    fetchLastVisit();
  }, [patient?._id, patientId]);

  // Fetch WhatsApp messages when dialog opens
  useEffect(() => {
    if (whatsappDialogOpen && patientId) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          const response = await getPatientWhatsAppMessages(patientId, 100);
          if (response.success && response.data) {
            setWhatsappMessages(response.data.messages || []);
          }
        } catch (err) {
          console.error("Failed to load messages:", err);
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchMessages();
    }
  }, [whatsappDialogOpen, patientId]);

  // Display patient info
  const displayPatient = useMemo(() => {
    if (!patient) return null;
    return {
      fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`.trim(),
      age: patient.age || "—",
      gender: patient.gender || "—",
      phone: patient.phone || "Not provided",
      email: patient.email || "Not provided",
      medieaseClinicEmail: patient.medieaseClinicEmail || "Not generated",
      bloodGroup: patient.bloodGroup || "Not recorded",
      address: patient.address || "Not provided",
      city: patient.city || "Not provided",
      state: patient.state || "Not provided",
      emergencyContact: patient.emergencyContact || "Not provided",
      emergencyContactPhone: patient.emergencyContactPhone || "Not provided",
      vitals: patient.vitals || {},
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      insurancePlanName: patient.insurancePlanName,
      insuranceCoverageLimit: patient.insuranceCoverageLimit,
      insuranceCoverageUsed: patient.insuranceCoverageUsed,
      insuranceNotes: patient.insuranceNotes,
      insuranceValidFrom: patient.insuranceValidFrom,
      insuranceValidUntil: patient.insuranceValidUntil,
      insuranceFamilyMembersCovered: patient.insuranceFamilyMembersCovered,
      insuranceStatus: patient.insuranceStatus,
      insuranceClaims: patient.insuranceClaims || [],
    };
  }, [patient]);

  // Get latest vitals
  const latestVitals = useMemo(() => {
    if (vitals.length === 0) return null;
    return vitals[0];
  }, [vitals]);

  // Get active vitals (from latest vitals or patient vitals)
  const activeVitals = useMemo(() => {
    if (latestVitals) {
      return {
        bloodPressure: latestVitals.bloodPressure,
        heartRate: latestVitals.heartRate?.toString(),
        temperature: latestVitals.temperature?.toString(),
        weight: latestVitals.weight?.toString(),
        oxygenSaturation: latestVitals.oxygenSaturation?.toString(),
        bloodGlucose: latestVitals.bloodGlucose?.toString(),
        respiratoryRate: latestVitals.respiratoryRate?.toString(),
      };
    }
    return displayPatient?.vitals || {};
  }, [latestVitals, displayPatient]);

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

  // Format display date
  const formatDisplayDate = (value?: string, fallback = "Not recorded") => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Insurance calculations
  const insuranceClaims = Array.isArray(displayPatient?.insuranceClaims)
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

  const insuranceProviderName =
    activeInsuranceRecord?.provider ||
    fallbackInsuranceMeta?.insuranceProvider ||
    "Insurance Provider";

  const insurancePlanName =
    activeInsuranceRecord?.planName ||
    fallbackInsuranceMeta?.insurancePlanName ||
    insuranceProviderName ||
    "Insurance Plan";

  const insuranceStatus =
    activeInsuranceRecord?.status ||
    fallbackInsuranceMeta?.insuranceStatus ||
    (fallbackInsuranceMeta?.insuranceProvider ? "Active" : "Inactive");

  const insuranceValidFrom =
    activeInsuranceRecord?.validFrom || fallbackInsuranceMeta?.insuranceValidFrom;
  const insuranceValidUntil =
    activeInsuranceRecord?.validUntil || fallbackInsuranceMeta?.insuranceValidUntil;

  const familyMembersCovered =
    activeInsuranceRecord?.familyMembersCovered ??
    fallbackInsuranceMeta?.insuranceFamilyMembersCovered ??
    fallbackInsuranceMeta?.familyMembersCovered ??
    fallbackInsuranceMeta?.coveredMembers;

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
    activeInsuranceRecord?.coverageLimit || fallbackInsuranceMeta?.insuranceCoverageLimit;
  const coverageUsedSource =
    activeInsuranceRecord?.coverageUsed || fallbackInsuranceMeta?.insuranceCoverageUsed;
  const coverageRemainingSource =
    activeInsuranceRecord?.coverageRemaining || fallbackInsuranceMeta?.insuranceCoverageRemaining;

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
    displayPatient?.insuranceNumber ||
    "Not provided";

  const insurancePolicyNumberDisplay =
    activeInsuranceRecord?.policyNumber ||
    displayPatient?.insuranceNumber ||
    "Not provided";

  const insuranceMemberName =
    activeInsuranceRecord?.memberName || displayPatient?.fullName || "Member";

  const insuranceNotesDisplay =
    activeInsuranceRecord?.notes ||
    displayPatient?.insuranceNotes ||
    "Insurance verification is handled by the receptionist team. Please ensure policy details are up to date before processing claims.";

  const hasInsuranceRecords = insuranceRecords.length > 0;

  // Insurance management functions
  const formatInsuranceCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const handleInsuranceFieldChange = (field: string, value: string | boolean) => {
    setInsuranceForm((prev) => ({
      ...prev,
      [field]: field === "cardNumber" && typeof value === "string"
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
        memberName: record.memberName || displayPatient?.fullName || "",
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
    } else {
      setInsuranceForm({
        provider: "",
        planName: "",
        policyNumber: "",
        cardNumber: "",
        memberName: displayPatient?.fullName || "",
        status: "Active",
        coverageLimit: "",
        coverageUsed: "",
        coverageRemaining: "",
        validFrom: "",
        validUntil: "",
        familyMembersCovered: "",
        notes: "",
        isPrimary: false,
      });
      setEditingInsuranceId(null);
    }
    setIsInsuranceDialogOpen(true);
  };

  const closeInsuranceDialog = () => {
    setIsInsuranceDialogOpen(false);
    setInsuranceForm({
      provider: "",
      planName: "",
      policyNumber: "",
      cardNumber: "",
      memberName: displayPatient?.fullName || "",
      status: "Active",
      coverageLimit: "",
      coverageUsed: "",
      coverageRemaining: "",
      validFrom: "",
      validUntil: "",
      familyMembersCovered: "",
      notes: "",
      isPrimary: false,
    });
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

    const assignString = (key: keyof typeof insuranceForm) => {
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

    if (insuranceFormBenefits.size > 0) {
      payload.selectedBenefits = Array.from(insuranceFormBenefits);
    }

    return payload;
  };

  const handleInsuranceFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId) {
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
          patientId: patientId,
        });
        toast({ title: "Insurance added" });
      } else if (editingInsuranceId) {
        await updatePatientInsurance(editingInsuranceId, payload);
        toast({ title: "Insurance updated" });
      }
      
      // Refresh insurance records
      const insurances = await fetchPatientInsurances(patientId);
      setInsuranceRecords(insurances);
      
      closeInsuranceDialog();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save insurance",
      });
    } finally {
      setIsSavingInsurance(false);
    }
  };

  const handleDeleteInsurance = async (insuranceId: string) => {
    if (!confirm("Are you sure you want to delete this insurance record?")) {
      return;
    }
    setDeletingInsuranceId(insuranceId);
    try {
      await deletePatientInsurance(insuranceId);
      toast({ title: "Insurance deleted" });
      
      // Refresh insurance records
      const insurances = await fetchPatientInsurances(patientId!);
      setInsuranceRecords(insurances);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete insurance",
      });
    } finally {
      setDeletingInsuranceId(null);
    }
  };

  // Handle Request Profile Update
  const handleRequestProfileUpdate = async () => {
    if (!patient || !patient.phone) {
      toast({
        title: "Error",
        description: "Patient phone number is required",
        variant: "destructive",
      });
      return;
    }

    const phone = patient.phone.replace(/\s+/g, "");
    const whatsappPhone = phone.startsWith("+")
      ? `whatsapp:${phone}`
      : phone.startsWith("91")
      ? `whatsapp:+${phone}`
      : `whatsapp:+91${phone}`;

    const message = `Hello ${displayPatient?.fullName || "Patient"},

This is a message from ${user?.firstName || "the clinic"}. 

Please update your profile information if there are any changes to your:
- Contact details (phone, email, address)
- Emergency contact information
- Medical history or allergies

If you have any questions, please contact us.

Thank you!`;

    setIsSendingUpdate(true);
    try {
      const response = await sendWhatsAppMessage({
        to: whatsappPhone,
        message,
        patient_id: patient._id,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Profile update request sent successfully",
        });
        // Refresh messages
        if (whatsappDialogOpen) {
          const msgResponse = await getPatientWhatsAppMessages(patientId!, 100);
          if (msgResponse.success && msgResponse.data) {
            setWhatsappMessages(msgResponse.data.messages || []);
          }
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSendingUpdate(false);
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return timestamp;
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return timestamp;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "delivered" || statusLower === "read" || statusLower === "sent") {
      return <Badge className="bg-green-500 text-xs">Delivered</Badge>;
    } else if (statusLower === "failed" || statusLower === "undelivered") {
      return <Badge className="bg-red-500 text-xs">Failed</Badge>;
    } else if (statusLower === "queued" || statusLower === "sending") {
      return <Badge className="bg-yellow-500 text-xs">Sending</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2Icon className="w-8 h-8 animate-spin text-[#00C4B3]" />
      </div>
    );
  }

  if (error || !patient || !displayPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">{error || "Patient not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <h1 className="text-3xl font-bold text-foreground">
                {displayPatient.fullName}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm leading-relaxed">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {displayPatient.age} years
                    {displayPatient.gender !== "—" ? ` • ${displayPatient.gender}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ActivityIcon className="w-4 h-4" />
                  <span>Blood Type: {displayPatient.bloodGroup}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{displayPatient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="w-4 h-4 text-[#00C4B3]" />
                  <span className="text-foreground">
                    {displayPatient.medieaseClinicEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="w-4 h-4" />
                  <span>{displayPatient.email}</span>
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
              <Button
                size="sm"
                className="px-4 bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                onClick={() => {
                  // TODO: Implement consent and profile update link functionality
                  toast({
                    title: "Feature Coming Soon",
                    description: "This feature will send a consent request and profile update link to the patient.",
                  });
                }}
              >
                <SendIcon className="w-4 h-4 mr-2" />
                Request Profile Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full overflow-x-auto rounded-xl bg-muted/40 p-1 flex flex-wrap gap-1">
          <TabsTrigger
            value="overview"
            className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="insurance"
            className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-foreground"
          >
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
                          <p className="text-base font-semibold text-foreground mb-0.5">
                            {activeVitals.bloodPressure
                              ? `${activeVitals.bloodPressure} mmHg`
                              : "—"}
                          </p>
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
                        {activeVitals.bloodPressure && (
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
                          <p className="text-base font-semibold text-foreground mb-0.5">
                            {activeVitals.heartRate
                              ? `${activeVitals.heartRate} bpm`
                              : "—"}
                          </p>
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
                        {activeVitals.heartRate && (
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
                          <p className="text-base font-semibold text-foreground mb-0.5">
                            {activeVitals.temperature
                              ? `${activeVitals.temperature}°F`
                              : "—"}
                          </p>
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
                        {activeVitals.temperature && (
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
                          <p className="text-base font-semibold text-foreground mb-0.5">
                            {activeVitals.weight ? `${activeVitals.weight} lbs` : "—"}
                          </p>
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
                          <p className="text-xs font-semibold text-foreground">
                            {activeVitals.bloodGlucose
                              ? `${activeVitals.bloodGlucose} mg/dL`
                              : "—"}
                          </p>
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
                          <p className="text-xs font-semibold text-foreground">
                            {activeVitals.oxygenSaturation
                              ? `${activeVitals.oxygenSaturation}%`
                              : "—"}
                          </p>
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
                          <p className="text-xs font-semibold text-foreground">
                            {activeVitals.respiratoryRate
                              ? `${activeVitals.respiratoryRate} bpm`
                              : "—"}
                          </p>
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

            {/* Contact Information */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="w-4 h-4 text-[#00C4B3]" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Section */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                        <MailIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Address
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {displayPatient.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        City
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {displayPatient.city}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        State
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {displayPatient.state}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="pt-3 border-t border-border/60">
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Emergency Contact
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                          <p className="text-sm font-medium text-foreground">
                            {typeof displayPatient.emergencyContact === "object" 
                              ? displayPatient.emergencyContact?.name || "Not provided"
                              : displayPatient.emergencyContact || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 flex-shrink-0">
                          <PhoneIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                          <p className="text-sm font-medium text-foreground">
                            {typeof displayPatient.emergencyContact === "object"
                              ? displayPatient.emergencyContact?.phone || displayPatient.emergencyContactPhone || "Not provided"
                              : displayPatient.emergencyContactPhone || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {typeof displayPatient.emergencyContact === "object" && displayPatient.emergencyContact?.relationship && (
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">Relationship</p>
                            <p className="text-sm font-medium text-foreground">
                              {displayPatient.emergencyContact.relationship}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Icon */}
          <div className="flex justify-center">
            <Button
              onClick={() => setWhatsappDialogOpen(true)}
              className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20BD5A] hover:to-[#0E7A6E] text-white"
              size="lg"
            >
              <MessageSquareIcon className="w-5 h-5 mr-2" />
              View WhatsApp Messages
            </Button>
          </div>
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
          </div>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Messages Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              WhatsApp Messages - {displayPatient.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Request Profile Update Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleRequestProfileUpdate}
                disabled={isSendingUpdate}
                className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20BD5A] hover:to-[#0E7A6E] text-white"
              >
                {isSendingUpdate ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="w-4 h-4 mr-2" />
                    Request Profile Update
                  </>
                )}
              </Button>
            </div>

            {/* Messages List */}
            <ScrollArea className="flex-1 border rounded-lg p-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="w-6 h-6 animate-spin text-[#00C4B3]" />
                </div>
              ) : whatsappMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquareIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No WhatsApp messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {whatsappMessages.map((message) => (
                    <div
                      key={message.message_sid || Math.random()}
                      className={`flex ${
                        message.direction === "outbound"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.direction === "outbound"
                            ? "bg-[#25D366] text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <p
                            className={`text-[10px] ${
                              message.direction === "outbound"
                                ? "text-green-100"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatMessageTime(message.received_at)}
                          </p>
                          {getStatusBadge(message.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insurance Dialog */}
      {canManageInsurance && (
        <Dialog open={isInsuranceDialogOpen} onOpenChange={(open) => (open ? setIsInsuranceDialogOpen(true) : closeInsuranceDialog())}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  ) : (
                    insuranceDialogMode === "create" ? "Add Insurance" : "Update Insurance"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

