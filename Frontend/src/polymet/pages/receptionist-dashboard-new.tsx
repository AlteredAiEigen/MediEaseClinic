import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  CheckCircleIcon,
  UserPlusIcon,
  AlertCircleIcon,
  ActivityIcon,
  SearchIcon,
  FilterIcon,
  UsersIcon,
  ClockIcon,
  BellIcon,
  TrendingUpIcon,
  FileTextIcon,
  Loader2Icon,
  UploadIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { get, post, patch, put } from "@/lib/api-client";
import { NewAppointmentDialog } from "@/polymet/components/new-appointment-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useQueueWebSocket } from "@/hooks/use-websocket";

interface Patient {
  _id: string;
  patientId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  age?: string;
  gender?: string;
  phone?: string;
  email?: string;
}

interface QueueEntry {
  _id: string;
  queue_id: string;
  patient: {
    _id: string;
    fullName: string;
    patientId: string;
    age?: string;
    gender?: string;
    phone?: string;
  };
  doctor: {
    _id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
  appointment?: string;
  checked_in_at: string;
  status: string;
  queue_number: number;
  priority: string;
  reason: string;
  notes: string;
  wait_time: number;
}

interface QueueStats {
  total_patients: number;
  waiting: number;
  in_consultation: number;
  completed: number;
  checked_out: number;
  checkout_pending?: number;
  cancelled?: number;
  average_wait_time: number;
}

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
  if (rawData && Array.isArray(rawData.queue)) {
    return rawData.queue as T[];
  }
  if (rawData && Array.isArray(rawData.patients)) {
    return rawData.patients as T[];
  }
  if (rawData && Array.isArray(rawData.doctors)) {
    return rawData.doctors as T[];
  }
  return [];
};

const normalizeId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.$oid === "string") return record.$oid;
    if (typeof record._id === "string") return record._id;
  }
  try {
    return String(value);
  } catch {
    return undefined;
  }
};

export function ReceptionistDashboardNew() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queueList, setQueueList] = useState<QueueEntry[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const navigate = useNavigate();
  
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [checkInReason, setCheckInReason] = useState("");
  const [checkInPriority, setCheckInPriority] = useState("medium");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [addPatientDialog, setAddPatientDialog] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [agreedToTermsReceptionist, setAgreedToTermsReceptionist] = useState(false);
  const [scheduleAppointmentDialog, setScheduleAppointmentDialog] = useState(false);
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<string>("");
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] =
    useState<"patients" | "appointments">("patients");
  const [queueDetailTab, setQueueDetailTab] =
    useState<"checked-in" | "consultation">("checked-in");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [processingAppointmentId, setProcessingAppointmentId] = useState<string | null>(null);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedQueueEntry, setSelectedQueueEntry] = useState<QueueEntry | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [selectedPrescriptionFile, setSelectedPrescriptionFile] = useState<File | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showNoPrescriptionConfirm, setShowNoPrescriptionConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add WebSocket for real-time updates
  const { lastMessage, isConnected } = useQueueWebSocket();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!checkoutDialog) {
      setPrescriptionFile(null);
      setSelectedPrescriptionFile(null);
      setShowNoPrescriptionConfirm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [checkoutDialog]);

  const cleanupOldAppointments = useCallback(async () => {
    try {
      const response = await post("/api/queue/cleanup");
      if (!response.success) {
        console.warn("Cleanup endpoint responded without success");
      }
    } catch (error) {
      console.warn("Failed to run cleanup endpoint", error);
    }
  }, []);

  const fetchQueueData = useCallback(async () => {
    try {
      const response = await get<{ queue?: QueueEntry[]; data?: QueueEntry[] | QueueEntry }>("/api/queue");
      if (response.success) {
        // Handle different response formats - queue can be directly in data or nested
        let queueData: QueueEntry[] = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            queueData = response.data;
          } else if (Array.isArray((response.data as any).queue)) {
            queueData = (response.data as any).queue;
          } else if (Array.isArray((response.data as any).data)) {
            queueData = (response.data as any).data;
          }
        }
        setQueueList(queueData);
      } else {
        setQueueList([]);
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
      setQueueList([]);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
    const response = await get<{ data?: Patient[]; patients?: Patient[] }>(
      "/api/patients?limit=100"
    );
      if (response.success) {
        const patientsData = extractList<Patient>(response.data);
        setPatients(patientsData);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    }
  }, []);

  const fetchQueueStats = useCallback(async () => {
    try {
      const response = await get<QueueStats>("/api/queue/stats");
      if (response.success && response.data) {
        setQueueStats(response.data);
      }
    } catch (err) {
      console.error("Failed to load queue stats:", err);
    }
  }, []);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    // Format as: 98765 43210 (5 digits space 5 digits)
    if (limitedDigits.length <= 5) {
      return limitedDigits;
    }
    return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setNewPatient((prev) => ({ ...prev, phone: formatted }));
  };

  const handleAddPatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.email || !newPatient.phone) {
      alert("Please fill in all required fields (First Name, Last Name, Email, Phone)");
      return;
    }

    if (!agreedToTermsReceptionist) {
      alert("Please confirm that the patient has been informed about data security terms before registering.");
      return;
    }

    try {
      setIsAddingPatient(true);
      
      // Calculate age from date of birth
      const calculateAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return "0";
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age.toString();
      };

      const payload = {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        email: newPatient.email,
        phone: `+91 ${newPatient.phone.replace(/\s/g, '')}`.trim(),
        dateOfBirth: newPatient.dateOfBirth || undefined,
        age: newPatient.dateOfBirth ? calculateAge(newPatient.dateOfBirth) : "0",
        gender: newPatient.gender || undefined,
        address: newPatient.address || undefined,
        bloodGroup: newPatient.bloodGroup || undefined,
        agreedToDataStorage: true, // Patient has agreed via checkbox
      };

      const response = await post<{ patient: any }>("/api/patients", payload);

      if (response.success && response.data?.patient) {
        const newPatientId = response.data.patient._id;
        setAddPatientDialog(false);
        setNewPatient({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          gender: "",
          address: "",
          bloodGroup: "",
        });
        setAgreedToTermsReceptionist(false);
        // Open schedule appointment dialog with the newly created patient pre-selected
        setSelectedPatientForAppointment(newPatientId);
        setScheduleAppointmentDialog(true);
      } else {
        alert(response.message || "Failed to add patient");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add patient";
      alert(message);
    } finally {
      setIsAddingPatient(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedPatientId) {
      alert("Please select an appointment");
      return;
    }

    try {
      setIsCheckingIn(true);
      // Use appointment-based check-in
      const response = await post("/api/queue/check-in", {
        appointmentId: selectedPatientId, // normalized appointment id
        reason: checkInReason || "General Consultation",
        priority: checkInPriority,
        notes: "",
      });

      if (response.success) {
        setAppointmentsList((prev) =>
          prev.map((apt) => {
            const key = apt.mongoId ?? apt.id ?? apt.appointmentId;
            if (key === selectedPatientId) {
              return { ...apt, status: "checked-in" };
            }
            return apt;
          })
        );
        setCheckInDialog(false);
        setSelectedPatientId("");
        setCheckInReason("");
        setCheckInPriority("medium");
        fetchQueueData();
        fetchQueueStats();
        fetchTodayAppointments(); // Refresh appointments list
      } else {
        alert(response.message || "Failed to check in patient");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check in patient";
      alert(message);
      console.error("Failed to check in patient:", err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckInFromAppointment = async (appointment: any) => {
    const appointmentMongoId =
      appointment?.mongoId || appointment?.id || appointment?.appointmentId;
    if (!appointmentMongoId) {
      toast({
        variant: "destructive",
        title: "Check-in unavailable",
        description: "Unable to identify the selected appointment.",
      });
      return;
    }

    try {
      setProcessingAppointmentId(appointmentMongoId);
      const response = await post("/api/queue/check-in", {
        appointmentId: appointmentMongoId,
        reason: appointment.reason || "General Consultation",
        priority: "medium",
        notes: "",
      });

      if (response.success) {
        setAppointmentsList((prev) =>
          prev.map((apt) => {
            const key = apt.mongoId ?? apt.id ?? apt.appointmentId;
            if (key === appointmentMongoId) {
              return { ...apt, status: "checked-in" };
            }
            return apt;
          })
        );
        toast({
          title: "Patient checked in",
          description: `${appointment.patientName} has been moved to the queue.`,
        });
        fetchQueueData();
        fetchQueueStats();
        fetchTodayAppointments();
      } else {
        toast({
          variant: "destructive",
          title: "Unable to check in",
          description: response.message || "Please try again in a moment.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to check in appointment.";
      toast({
        variant: "destructive",
        title: "Unable to check in",
        description: message,
      });
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  const checkedInPatients = queueList.filter((q) => q.status === "waiting").length;
  const waitingPatients = queueList.filter((q) => q.status === "waiting").length;
  const inConsultation = queueList.filter((q) => q.status === "in-consultation").length;
  const awaitingCheckout = queueList.filter((q) => q.status === "completed" || q.status === "checkout-pending" || q.status === "checkout").length;
  const completedToday = queueStats?.checked_out ?? 0;

  // Move patient from queue back to appointments (persist to backend)
  const moveBackToAppointments = async (queueEntryId: string, appointmentId?: string) => {
    try {
      // Cancel the queue entry
      const queueResponse = await put(`/api/queue/${queueEntryId}/status`, {
        status: "cancelled"
      });

      if (!queueResponse.success) {
        throw new Error(queueResponse.message || "Failed to remove patient from queue");
      }

      // Update appointment status back to "scheduled" if appointment exists
      if (appointmentId) {
        try {
          await patch(`/api/appointments/${appointmentId}/status`, {
            status: "scheduled"
          });
        } catch (err) {
          // Log but don't fail - queue entry is already cancelled
          console.warn("Failed to update appointment status:", err);
        }
      }

      toast({
        title: "Patient moved back to appointments",
        description: "The patient has been removed from the queue and moved back to appointments.",
      });

      // Refresh data to ensure consistency
      fetchQueueData();
      fetchQueueStats();
      fetchTodayAppointments();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to move patient back to appointments";

      toast({
        title: "Operation failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const fetchTodayAppointments = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await get(`/api/appointments?date=${today}&limit=100`);
      if (response.success) {
        const rawAppointments = extractList<any>(response.data);
        const mappedAppointments = rawAppointments.map((apt: any) => {
          // Extract valid MongoDB ObjectId (must be 24 hex characters)
          const mongoId = extractMongoObjectId(apt);
          const appointmentIdentifier = normalizeId(apt.appointmentId);
          
          // Use mongoId if available, otherwise fallback (but log warning)
          if (!mongoId) {
            console.warn("⚠️ No valid MongoDB _id found for appointment:", apt);
          }

          return {
            id: mongoId ?? appointmentIdentifier ?? Math.random().toString(36).slice(2),
            mongoId: mongoId ?? undefined, // Only set if valid ObjectId
            appointmentId: appointmentIdentifier,
            patientId: normalizeId(apt.patientId) ?? apt.patientId,
            patientName: apt.patientName || apt.patient?.fullName || "Unknown Patient",
            time: apt.time ?? "—",
            date: apt.date ?? new Date().toISOString().split("T")[0],
            reason: apt.reason || "General Consultation",
            status: apt.status ?? "scheduled",
            type: apt.type || apt.appointmentType,
            doctorId: normalizeId(apt.doctorId) ?? normalizeId(apt.doctor?._id),
            doctorName:
              apt.doctorName ||
              apt.doctor?.fullName ||
              [apt.doctor?.firstName, apt.doctor?.lastName].filter(Boolean).join(" "),
          };
        });
        setAppointmentsList(mappedAppointments);
      }
    } catch (err) {
      console.error("Failed to load appointments:", err);
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      await cleanupOldAppointments();
      await Promise.all([
        fetchQueueData(),
        fetchQueueStats(),
        fetchPatients(),
        fetchTodayAppointments(),
      ]);
    };

    loadInitial();

    // Lightweight periodic refresh as a safety net; most updates come from WebSocket
    const interval = setInterval(() => {
      void Promise.all([fetchQueueData(), fetchQueueStats()]);
    }, 60000);

    return () => clearInterval(interval);
  }, [cleanupOldAppointments, fetchQueueData, fetchQueueStats, fetchPatients, fetchTodayAppointments]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    const handleQueueUpdate = async () => {
      try {
        if (lastMessage.type === 'patient_checked_in' ||
            lastMessage.type === 'patient_status_updated' ||
            lastMessage.type === 'queue_reordered' ||
            lastMessage.type === 'appointment_status_updated') {
          // Refresh queue data and stats silently (no loading state)
          console.log('🔄 Refreshing queue data due to:', lastMessage.type);
          await Promise.all([
            fetchQueueData(),
            fetchQueueStats()
          ]);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    handleQueueUpdate();
  }, [lastMessage, fetchTodayAppointments, fetchQueueData, fetchQueueStats]);

  const averageWaitMinutes = Math.max(
    0,
    Math.round(queueStats?.average_wait_time ?? 0)
  );

  const waitStatus = (() => {
    if (averageWaitMinutes === 0) {
      return {
        label: "No Active Queue",
        description: "Waiting room is clear",
        tone: "text-emerald-600",
      };
    }
    if (averageWaitMinutes < 15) {
      return {
        label: "Smooth Flow",
        description: "Patients are being seen on time",
        tone: "text-teal-600",
      };
    }
    if (averageWaitMinutes < 30) {
      return {
        label: "Moderate Delay",
        description: "Consider prioritizing high-acuity cases",
        tone: "text-amber-600",
      };
    }
    return {
      label: "High Delay",
      description: "Bring additional doctors online",
      tone: "text-red-600",
    };
  })();

  const showPeakBadge = averageWaitMinutes >= 15;

const formatAppointmentTime = (date?: string, time?: string) => {
  if (!time) return "—";
  const trimmed = time.trim();

  // If already has AM/PM, just normalize casing
  if (/[AP]M$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Interpret as HH:MM 24h without timezone conversion
  const [hh, mm] = trimmed.split(":");
  const hour = Number(hh);
  if (Number.isNaN(hour)) return trimmed;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1; // 0,12 -> 12; 13->1 etc.
  return `${displayHour}:${mm ?? "00"} ${suffix}`;
};

const normalizedQuery = searchQuery.trim().toLowerCase();

const matchesAppointment = (appointment: any) => {
  if (!normalizedQuery) return true;
  return [
    appointment.patientName ?? "",
    appointment.reason ?? "",
    appointment.status ?? "",
    appointment.time ?? "",
    appointment.date ?? "",
    appointment.doctorName ?? "",
  ].some((field) => field.toLowerCase().includes(normalizedQuery));
};

const matchesQueueEntry = (entry: QueueEntry) => {
  if (!normalizedQuery) return true;
  const doctorName =
    entry.doctor?.fullName ||
    [entry.doctor?.firstName, entry.doctor?.lastName]
      .filter(Boolean)
      .join(" ");
  return [
    entry.patient?.fullName ?? "",
    entry.patient?.patientId ?? "",
    entry.reason ?? "",
    doctorName ?? "",
  ].some((field) => field.toLowerCase().includes(normalizedQuery));
};

const matchesPatient = (patient: Patient) => {
  if (!normalizedQuery) return false;
  return [
    patient.fullName,
    patient.firstName,
    patient.lastName,
    patient.patientId,
    patient.email,
    patient.phone,
  ]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(normalizedQuery));
};

const todayDate = new Date().toISOString().split("T")[0];
const todaysAppointments = appointmentsList.filter((appointment) => {
  const dateValue = (appointment.date ?? "").slice(0, 10);
  const statusValue = (appointment.status ?? "scheduled").toLowerCase();
  return dateValue === todayDate && statusValue === "scheduled";
});

const appointmentByPatientId = new Map<string, any>();
appointmentsList.forEach((apt) => {
  if (apt.patientId) {
    const key = apt.patientId;
    const existing = appointmentByPatientId.get(key);
    if (!existing || (apt.date && apt.time && `${apt.date} ${apt.time}` < `${existing.date} ${existing.time}`)) {
      appointmentByPatientId.set(key, apt);
    }
  }
});

const filteredAppointments =
  normalizedQuery && searchFilter === "appointments"
    ? todaysAppointments.filter(matchesAppointment)
    : todaysAppointments;

const appointmentSearchResults =
  normalizedQuery && searchFilter === "appointments"
    ? appointmentsList.filter(matchesAppointment)
    : [];

const patientSearchResults =
  normalizedQuery && searchFilter === "patients"
    ? patients.filter(matchesPatient)
    : [];

const checkInEntries = queueList.filter((entry) => entry.status === "waiting");
const consultationEntries = queueList.filter(
  (entry) => entry.status === "in-consultation"
);
const checkoutEntries = queueList.filter(
  (entry) =>
    entry.status === "completed" ||
    entry.status === "checkout" ||
    entry.status === "checkout-pending"
);

const shouldFilterQueue = normalizedQuery && searchFilter === "patients";

const filteredCheckInEntries = shouldFilterQueue
  ? checkInEntries.filter(matchesQueueEntry)
  : checkInEntries;
const filteredConsultationEntries = shouldFilterQueue
  ? consultationEntries.filter(matchesQueueEntry)
  : consultationEntries;
const filteredCheckoutEntries = shouldFilterQueue
  ? checkoutEntries.filter(matchesQueueEntry)
  : checkoutEntries;

// Helper to check if a string is a valid MongoDB ObjectId (24 hex characters)
const isValidObjectId = (id: string | undefined | null): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Helper to extract valid MongoDB ObjectId from appointment data
const extractMongoObjectId = (apt: any): string | undefined => {
  // Try _id first (most reliable)
  const id = normalizeId(apt._id);
  if (id && isValidObjectId(id)) return id;
  
  // Try id field
  const idField = normalizeId(apt.id);
  if (idField && isValidObjectId(idField)) return idField;
  
  return undefined;
};

const resolveAppointmentIdForEntry = (entry: QueueEntry): string | undefined => {
  // First try direct appointment field (should be MongoDB _id)
  const direct = normalizeId(entry.appointment);
  if (direct && isValidObjectId(direct)) {
    console.log("✅ Using direct appointment ID (MongoDB _id):", direct);
    return direct;
  }

  // Try to find appointment by patient
  const patientKey =
    entry.patient?.patientId ??
    normalizeId(entry.patient?._id) ??
    normalizeId((entry as any)?.patientId);

  if (!patientKey) {
    console.warn("⚠️ No patient key found for queue entry");
    return undefined;
  }
  
  const appointment = appointmentByPatientId.get(patientKey);
  if (!appointment) {
    console.warn("⚠️ No appointment found for patient:", patientKey);
    return undefined;
  }

  // Prioritize mongoId (should be MongoDB _id)
  if (appointment?.mongoId && isValidObjectId(appointment.mongoId)) {
    console.log("✅ Using appointment.mongoId (MongoDB _id):", appointment.mongoId);
    return appointment.mongoId;
  }
  
  // Fallback to id if it's a valid ObjectId
  if (appointment?.id && isValidObjectId(appointment.id)) {
    console.log("✅ Using appointment.id (MongoDB _id):", appointment.id);
    return appointment.id;
  }
  
  // Last resort: appointmentId (human-readable), but we need MongoDB _id
  // This is a problem - we need to fetch the appointment to get _id
  if (appointment?.appointmentId) {
    console.warn("⚠️ Only appointmentId found (not MongoDB _id):", appointment.appointmentId);
    // Return undefined to force error, as we need MongoDB _id
    return undefined;
  }
  
  console.warn("⚠️ No valid appointment ID found");
  return undefined;
};

const handleCompleteCheckout = async (skipPrescriptionWarning = false) => {
  if (!selectedQueueEntry) return;

  if (!prescriptionFile && !skipPrescriptionWarning) {
    setShowNoPrescriptionConfirm(true);
    return;
  }

  const appointmentId = resolveAppointmentIdForEntry(selectedQueueEntry);

  if (!appointmentId) {
    toast({
      title: "Checkout unavailable",
      description: "Unable to locate the appointment for this patient. Please check their appointment details and try again.",
      variant: "destructive",
    });
    return;
  }

  try {
    setIsCheckingOut(true);
    const queueId = selectedQueueEntry.queue_id;
    const queueEntryId = selectedQueueEntry._id;

    // Upload prescription if provided (don't fail checkout if upload fails)
    if (prescriptionFile) {
      try {
        console.log("📤 Uploading prescription file for appointment:", appointmentId);
        const formData = new FormData();
        formData.append("file", prescriptionFile);
        if (selectedQueueEntry.reason) {
          formData.append("notes", selectedQueueEntry.reason);
        }

        const uploadResponse = await post(`/api/appointments/${appointmentId}/prescription-upload`, formData);
        console.log("📤 Prescription upload response:", uploadResponse);
        
        if (!uploadResponse.success) {
          console.error("❌ Prescription upload failed:", {
            message: uploadResponse.message,
            data: uploadResponse.data,
            appointmentId: appointmentId,
          });
          toast({
            title: "Prescription upload warning",
            description: `Prescription upload failed: ${uploadResponse.message || "Unknown error"}. Checkout will continue.`,
            variant: "destructive",
          });
        } else {
          console.log("✅ Prescription uploaded successfully:", uploadResponse.data);
        }
      } catch (uploadErr: any) {
        console.error("❌ Prescription upload error:", {
          error: uploadErr,
          message: uploadErr?.message,
          response: uploadErr?.response?.data,
          appointmentId: appointmentId,
        });
        // Continue with checkout even if upload fails
        toast({
          title: "Prescription upload failed",
          description: `Upload error: ${uploadErr?.message || "Unknown error"}. Checkout will continue without the prescription file.`,
          variant: "destructive",
        });
      }
    }

    // Update appointment status to completed
    await patch(`/api/appointments/${appointmentId}/status`, {
      status: "completed",
    });

    // Check out from queue (this sets status to "checked-out" and is_active to False)
    // Use _id (MongoDB ObjectId) for the check-out endpoint, not queue_id
    if (!queueEntryId) {
      throw new Error("Queue entry ID not found");
    }
    
    const checkOutResponse = await post(`/api/queue/${queueEntryId}/check-out`, {});
    if (!checkOutResponse.success) {
      throw new Error(checkOutResponse.message || "Failed to check out patient from queue");
    }

    toast({
      title: "Checkout completed",
      description: `${selectedQueueEntry.patient.fullName} has been checked out successfully.`,
    });

    // Close dialog and clear state
    setCheckoutDialog(false);
    setSelectedQueueEntry(null);
    setPrescriptionFile(null);
    setSelectedPrescriptionFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Remove from local queue list immediately (filter by both _id and queue_id to be safe)
    setQueueList((prev) => 
      prev.filter((entry) => {
        const matchesId = entry._id && entry._id === queueEntryId;
        const matchesQueueId = entry.queue_id && entry.queue_id === queueId;
        return !matchesId && !matchesQueueId;
      })
    );
 
    // Refresh data to ensure consistency with backend
    await Promise.all([fetchQueueData(), fetchQueueStats(), fetchTodayAppointments()]);
  } catch (err) {
    console.error("Checkout error:", err);
    toast({
      title: "Checkout failed",
      description: err instanceof Error ? err.message : "Unable to complete checkout. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsCheckingOut(false);
    setShowNoPrescriptionConfirm(false);
  }
};

const confirmCheckoutWithoutPrescription = () => {
  setShowNoPrescriptionConfirm(false);
  void handleCompleteCheckout(true);
};

  return (
    <div className="space-y-6 p-1">
      {/* Real-time Clock & Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />

            <span className="text-lg font-semibold">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          <div className="h-6 w-px bg-white/30" />

          <span className="text-sm font-medium">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {showPeakBadge && (
            <Badge className="bg-amber-500 text-white border-0 shadow-md">
              <BellIcon className="h-3 w-3 mr-1" />
              Heavy Load
            </Badge>
          )}
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            {queueList.length} Active Patients
          </Badge>
          {isConnected ? (
            <Badge variant="outline" className="text-xs">
              <ActivityIcon className="w-3 h-3 mr-1 text-green-500" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <ActivityIcon className="w-3 h-3 mr-1 text-gray-400" />
              Offline
            </Badge>
          )}
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Checked In
                </p>
                <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                  {checkedInPatients}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for consultation
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <CheckCircleIcon className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  In Consultation
                </p>
                <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">
                  {inConsultation}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently with doctor
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <ActivityIcon className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Awaiting Checkout
                </p>
                <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {awaitingCheckout}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending prescription
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileTextIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Completed Today
                </p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedToday}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully checkout
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircleIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligent Waiting Room Monitor */}
      <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <TrendingUpIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Waiting Room Intelligence
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Real-time analytics and insights
                </p>
              </div>
            </div>
            <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Avg Wait Time
                </span>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {averageWaitMinutes} min
              </p>
              <Progress
                value={Math.min((averageWaitMinutes / 60) * 100, 100)}
                className="h-1.5 mt-2"
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Waiting
                </span>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {waitingPatients}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Patients in waiting room
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Status
                </span>
                <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={`text-lg font-bold ${waitStatus.tone}`}>
                {waitStatus.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {waitStatus.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace search */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-full bg-slate-50 px-4 py-2.5 text-sm shadow-inner dark:bg-slate-800/80">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search patients and appointments across the workspace"
              className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {normalizedQuery && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {searchFilter === "patients"
                  ? `${patientSearchResults.length} matching patient${
                      patientSearchResults.length === 1 ? "" : "s"
                    }`
                  : `${appointmentSearchResults.length} matching appointment${
                      appointmentSearchResults.length === 1 ? "" : "s"
                    }`}
              </span>
            )}
              </div>
          <Select
            value={searchFilter}
            onValueChange={(value: "patients" | "appointments") =>
              setSearchFilter(value)
            }
          >
            <SelectTrigger className="md:w-[200px] rounded-full border-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 text-sm font-medium text-white shadow-md hover:from-teal-700 hover:to-emerald-700">
              <FilterIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="patients">
                <span className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-emerald-600" />
                  Patients
                </span>
              </SelectItem>
              <SelectItem value="appointments">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-teal-600" />
                  Appointments
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {normalizedQuery && (
          <div className="text-xs text-muted-foreground md:pl-1">
            {searchFilter === "patients"
              ? `Searching patient records for “${searchQuery}”.`
              : `Searching appointments for “${searchQuery}”.`}
          </div>
        )}
      </div>

      {normalizedQuery && (
        <Card className="border border-border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {searchFilter === "patients"
                ? "Patient search results"
                : "Appointment search results"}
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchFilter === "patients" ? (
              patientSearchResults.length > 0 ? (
                patientSearchResults.slice(0, 8).map((patient) => (
                  <div
                    key={patient._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 text-sm dark:border-slate-700/60"
                  >
                    <div>
                      <p className="font-medium text-foreground">{patient.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.patientId ? `ID: ${patient.patientId}` : "Unassigned ID"}
                        {patient.phone ? ` • ${patient.phone}` : ""}
                      </p>
            </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setSearchFilter("appointments");
                          setSearchQuery(patient.fullName);
                        }}
                      >
                        View appointments
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No matching patients found.
                </p>
              )
            ) : appointmentSearchResults.length > 0 ? (
              appointmentSearchResults.slice(0, 8).map((appointment) => {
                const appointmentKey =
                  appointment.mongoId || appointment.id || appointment.appointmentId;
                const appointmentStatus = (appointment.status ?? "scheduled").toLowerCase();
                const isAlreadyCheckedIn = ["checked-in", "in-consultation", "ongoing", "checkout", "completed"].includes(
                  appointmentStatus
                );
                const isInQueue = queueList.some((queueEntry) => {
                  const patientId = queueEntry.patient?._id || queueEntry.patient?.patientId;
                  return (
                    patientId === appointment.patientId &&
                    ["waiting", "in-consultation"].includes(queueEntry.status)
                  );
                });
                const shouldShowCheckInButton = !isAlreadyCheckedIn && !isInQueue;
                const isProcessing = processingAppointmentId === appointmentKey;
                const formattedTime = formatAppointmentTime(appointment.date, appointment.time);
                return (
                  <div
                    key={appointmentKey}
                    className="space-y-3 rounded-lg border border-slate-200/70 p-3 text-sm dark:border-slate-700/60"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {appointment.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.reason || "General consultation"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Doctor: {appointment.doctorName || "Not assigned"}
                </p>
              </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className="text-sm font-semibold text-foreground">
                          {formattedTime}
                        </span>
                        {shouldShowCheckInButton ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={isProcessing}
                            onClick={() => handleCheckInFromAppointment(appointment)}
                          >
                            {isProcessing ? (
                              <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircleIcon className="mr-2 h-3 w-3" />
                            )}
                            Move to check-in
                          </Button>
                        ) : (
                          <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {isInQueue ? "In Queue" : "Checked in"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">
                        Status: {appointment.status?.replace("-", " ") ?? "scheduled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-0 text-xs font-medium text-slate-600 hover:text-slate-900"
                        onClick={() => navigate("/receptionist-appointments")}
                      >
                        View in appointments
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No matching appointments found.
              </p>
            )}
            {(searchFilter === "patients"
              ? patientSearchResults.length
              : appointmentSearchResults.length) > 8 && (
              <p className="pt-1 text-xs text-muted-foreground">
                Showing first 8 results. Refine your search for more matches.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-emerald-100 bg-emerald-50/70 shadow-sm dark:border-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <CalendarIcon className="h-4 w-4" />
              </span>
              <CardTitle className="text-base font-semibold text-emerald-700">
                Today&apos;s Appointments
              </CardTitle>
              </div>
            <Badge className="border-0 bg-emerald-200 text-emerald-700">
              {filteredAppointments.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[240px] max-h-[320px] overflow-y-auto pr-1">
            {filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-white/80 p-6 text-center dark:border-emerald-800/60 dark:bg-slate-900/50">
                <CalendarIcon className="mb-3 h-8 w-8 text-emerald-300" />
                <p className="text-sm font-semibold text-emerald-700">
                  No appointments scheduled today
                </p>
                <p className="mt-1 text-xs text-emerald-600/80">
                  All future appointments remain available in search.
                </p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => {
                const appointmentKey =
                  appointment.mongoId || appointment.id || appointment.appointmentId;
                const isProcessing = processingAppointmentId === appointmentKey;
                const isAlreadyCheckedIn =
                  (appointment.status ?? "").toLowerCase() === "checked-in";
                const isInQueue = queueList.some((queueEntry) => {
                  const patientId = queueEntry.patient?._id || queueEntry.patient?.patientId;
                  return (
                    patientId === appointment.patientId &&
                    ["waiting", "in-consultation"].includes(queueEntry.status)
                  );
                });
                const shouldShowCheckInButton = !isAlreadyCheckedIn && !isInQueue;
                const formattedTime = formatAppointmentTime(appointment.date, appointment.time);
                return (
                  <div
                    key={appointmentKey}
                    className="rounded-lg border border-emerald-100 bg-white/80 p-3 shadow-sm dark:border-emerald-800/60 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {appointment.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.reason || "General consultation"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Doctor: {appointment.doctorName || "Not assigned"}
                </p>
              </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formattedTime}
                        </span>
                        {shouldShowCheckInButton ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={isProcessing}
                            onClick={() => handleCheckInFromAppointment(appointment)}
                          >
                            {isProcessing ? (
                              <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircleIcon className="mr-2 h-3 w-3" />
                            )}
                            Move to check-in
                          </Button>
                        ) : (
                          <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {isInQueue ? "In Queue" : "Checked in"}
                          </Badge>
                        )}
            </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border border-sky-100 bg-sky-50/70 shadow-sm dark:border-sky-900">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500/10 p-2 text-sky-600">
                <UsersIcon className="h-4 w-4" />
              </span>
              <CardTitle className="text-base font-semibold text-sky-700">
                Queue Details
              </CardTitle>
            </div>
            <Badge className="border-0 bg-sky-200 text-sky-700">
              {queueDetailTab === "checked-in"
                ? filteredCheckInEntries.length
                : filteredConsultationEntries.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex rounded-full border border-sky-200 bg-white/70 p-1 text-sm dark:border-sky-800 dark:bg-slate-900/70">
              <button
                type="button"
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  queueDetailTab === "checked-in"
                    ? "bg-sky-500 text-white shadow"
                    : "text-sky-600 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-slate-800"
                }`}
                onClick={() => setQueueDetailTab("checked-in")}
              >
                Waiting
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  queueDetailTab === "consultation"
                    ? "bg-sky-500 text-white shadow"
                    : "text-sky-600 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-slate-800"
                }`}
                onClick={() => setQueueDetailTab("consultation")}
              >
                Consultation
              </button>
            </div>
            <div className="space-y-3 min-h-[240px] max-h-[320px] overflow-y-auto pr-1">
              {queueDetailTab === "checked-in" ? (
                filteredCheckInEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-sky-200 bg-white/80 p-6 text-center dark:border-sky-800/60 dark:bg-slate-900/50">
                    <CheckCircleIcon className="mb-3 h-8 w-8 text-sky-300" />
                    <p className="text-sm font-semibold text-sky-700">
                      No patients waiting
                    </p>
                    <p className="mt-1 text-xs text-sky-600/80">
                      Use the search to find more appointments.
                </p>
              </div>
                ) : (
                  filteredCheckInEntries.map((entry) => {
                    const appointment = appointmentByPatientId.get(entry.patient._id);
                    const patientMongoId = entry.patient?._id;
                    const appointmentId = resolveAppointmentIdForEntry(entry);
                    return (
                      <div
                        key={entry.queue_id}
                        className="rounded-lg border border-sky-100 bg-white/80 p-3 shadow-sm dark:border-sky-800/60 dark:bg-slate-900"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {entry.patient.fullName}
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {appointment?.time
                                ? formatAppointmentTime(appointment.date, appointment.time)
                                : "Walk-in"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                              {entry.reason || "General consultation"},{" "}
                              {appointment?.doctorName || "Any doctor"}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-300"
                            >
                              Waiting
                            </Badge>
                          </div>
                        </div>
                        {patientMongoId && (
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-6 px-2 text-[10px] hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                              onClick={() => moveBackToAppointments(entry._id, appointmentId)}
                              title="Move back to appointments"
                            >
                              <ArrowLeftIcon className="w-3 h-3 mr-1" />
                              Back
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : filteredConsultationEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-sky-200 bg-white/80 p-6 text-center dark:border-sky-800/60 dark:bg-slate-900/50">
                  <ClockIcon className="mb-3 h-8 w-8 text-sky-300" />
                  <p className="text-sm font-semibold text-sky-700">
                    No ongoing consultations
                  </p>
                  <p className="mt-1 text-xs text-sky-600/80">
                    Patients appear here while doctors are in session.
                </p>
              </div>
              ) : (
                filteredConsultationEntries.map((entry) => {
                  const doctorName =
                    entry.doctor?.fullName ||
                    [entry.doctor?.firstName, entry.doctor?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    "Assigned doctor";
                  return (
                    <div
                      key={entry.queue_id}
                      className="rounded-lg border border-sky-100 bg-white/80 p-3 shadow-sm dark:border-sky-800/60 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {entry.patient.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doctorName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-300"
                        >
                          In consultation
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {entry.reason || "Consultation in progress"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 bg-amber-50/70 shadow-sm dark:border-amber-900">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/10 p-2 text-amber-600">
                <FileTextIcon className="h-4 w-4" />
              </span>
              <CardTitle className="text-base font-semibold text-amber-700">
                Checkout
              </CardTitle>
            </div>
            <Badge className="border-0 bg-amber-200 text-amber-700">
              {filteredCheckoutEntries.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[240px] max-h-[320px] overflow-y-auto pr-1">
            {filteredCheckoutEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-200 bg-white/80 p-6 text-center dark:border-amber-800/60 dark:bg-slate-900/50">
                <FileTextIcon className="mb-3 h-8 w-8 text-amber-300" />
                <p className="text-sm font-semibold text-amber-700">
                  No patients in checkout
                </p>
                <p className="mt-1 text-xs text-amber-600/80">
                  Patients appear here when doctors end a consultation.
                </p>
              </div>
            ) : (
              filteredCheckoutEntries.map((entry) => {
                const appointmentLookupKey =
                  entry.patient?.patientId ??
                  normalizeId(entry.patient?._id) ??
                  normalizeId((entry as any)?.patientId);
                const appointment = appointmentLookupKey
                  ? appointmentByPatientId.get(appointmentLookupKey)
                  : undefined;

                return (
                  <div
                    key={entry.queue_id}
                    className="rounded-lg border border-amber-100 bg-white/80 p-3 shadow-sm dark:border-amber-800/60 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {entry.patient.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.doctor?.fullName ||
                            [entry.doctor?.firstName, entry.doctor?.lastName]
                              .filter(Boolean)
                              .join(" ") ||
                            "Consultation complete"}
                        </p>
                        {appointment?.time && (
                          <p className="text-xs text-amber-600 mt-1">
                            Appointment at {formatAppointmentTime(appointment.date, appointment.time)}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                      >
                        Awaiting checkout
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.reason || "Awaiting final paperwork"}
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                      onClick={() => {
                        setSelectedQueueEntry(entry);
                        setCheckoutDialog(true);
                      }}
                      disabled={
                        isCheckingOut &&
                        selectedQueueEntry?.queue_id === entry.queue_id
                      }
                    >
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload Prescription / Checkout
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={checkoutDialog}
        onOpenChange={(open) => {
          setCheckoutDialog(open);
          if (!open) {
            setSelectedQueueEntry(null);
            setSelectedPrescriptionFile(null);
            setPrescriptionFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout Patient</DialogTitle>
            <DialogDescription>
              Upload the prescription (if available) and complete the checkout process.
            </DialogDescription>
          </DialogHeader>
          {selectedQueueEntry && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium text-sm">
                  {selectedQueueEntry.patient.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {selectedQueueEntry.patient.patientId}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedQueueEntry.reason || "Awaiting checkout"}
                </p>
              </div>
              <Alert className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircleIcon className="h-5 w-5" />
                <AlertTitle>Upload the prescription if possible</AlertTitle>
                <AlertDescription>
                  Keeping a copy of the prescription ensures better continuity of care. Maximum 1 file, 10MB. The file will be saved securely. You can still complete checkout without a file, but please try to attach it when available.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Select Prescription File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file) {
                      // Validate file size (10MB limit)
                      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
                      if (file.size > maxSizeBytes) {
                        toast({
                          title: "File too large",
                          description: "File size must be less than 10MB. Please select a smaller file.",
                          variant: "destructive",
                        });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                        return;
                      }
                    }
                    setSelectedPrescriptionFile(file);
                    setPrescriptionFile(file);
                  }}
                  disabled={isCheckingOut}
                  className="hidden"
                  id="prescription-upload-input-checkout"
                />
                <label htmlFor="prescription-upload-input-checkout">
                  <div className="cursor-pointer">
                    {selectedPrescriptionFile ? (
                      <div className="p-4 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700">
                        <div className="flex items-center gap-2 mb-2">
                          <FileTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            File Selected
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 truncate">
                          {selectedPrescriptionFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(selectedPrescriptionFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-auto py-6 px-4 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:border-purple-600 dark:hover:bg-purple-950/30 transition-colors flex flex-col items-center justify-center gap-2">
                        <UploadIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        <div className="text-center">
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400 block">
                            Select Prescription File
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Click to upload or scan prescription file
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          PDF, JPG, PNG supported (Max 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </label>
                {selectedPrescriptionFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPrescriptionFile(null);
                      setPrescriptionFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={isCheckingOut}
                    className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Cancel selection
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG (Max 1 file, 10MB)
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCheckoutDialog(false);
                setSelectedQueueEntry(null);
                setSelectedPrescriptionFile(null);
                setPrescriptionFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={isCheckingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleCompleteCheckout();
              }}
              disabled={isCheckingOut}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isCheckingOut ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Complete Checkout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showNoPrescriptionConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowNoPrescriptionConfirm(false);
          }
        }}
      >
        <AlertDialogContent className="border border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Checkout without prescription?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Uploading prescriptions keeps patient records complete. Are you sure you want to finish checkout without attaching one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-200 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40">
              Go back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCheckoutWithoutPrescription}
              disabled={isCheckingOut}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-md"
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
 
      {/* Quick Actions */}
      <Card className="border border-border shadow-md bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <ActivityIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold">
              Quick Actions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setAddPatientDialog(true)}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
            >
              <UserPlusIcon className="w-5 h-5 mr-2" />
              Register New Patient
            </Button>
            <Link to="/receptionist-appointments" className="w-full">
              <Button className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl font-semibold">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Schedule Appointment
              </Button>
            </Link>
            <Link to="/receptionist-patients" className="w-full">
              <Button className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl font-semibold">
                <UsersIcon className="w-5 h-5 mr-2" />
                View All Patients
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Add Patient Dialog */}
      <Dialog open={addPatientDialog} onOpenChange={setAddPatientDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Register a new patient and add them to the queue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md bg-muted">
                    +91
                  </span>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={11}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newPatient.address}
                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                value={newPatient.bloodGroup}
                onValueChange={(value) => setNewPatient({ ...newPatient, bloodGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Security Confirmation */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-teal-900 dark:text-teal-100 text-sm">
                      Data Security Confirmation
                    </h4>
                    <p className="text-xs text-teal-800 dark:text-teal-200">
                      We protect your information by:
                    </p>
                    <ul className="space-y-1 text-xs text-teal-700 dark:text-teal-300 ml-4 list-disc">
                      <li>Encrypting all personal and medical data in our secure, all-in-one platform.</li>
                      <li>Enabling instant doctor access to your history for better, faster care.</li>
                      <li>Storing data securely with controlled sharing options as per regulations.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="agreeToTermsReceptionist"
                    checked={agreedToTermsReceptionist}
                    onCheckedChange={(checked) => setAgreedToTermsReceptionist(checked === true)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="agreeToTermsReceptionist"
                    className="text-xs font-medium text-teal-900 dark:text-teal-100 cursor-pointer leading-tight"
                  >
                    I confirm that the patient has been informed about how we protect their data and agrees to the terms above.
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddPatientDialog(false);
                setNewPatient({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  dateOfBirth: "",
                  gender: "",
                  address: "",
                  bloodGroup: "",
                });
                setAgreedToTermsReceptionist(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPatient}
              disabled={isAddingPatient || !agreedToTermsReceptionist}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isAddingPatient ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Add Patient
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Appointment Dialog */}
      <NewAppointmentDialog
        open={scheduleAppointmentDialog}
        onOpenChange={(open) => {
          setScheduleAppointmentDialog(open);
          if (!open) {
            setSelectedPatientForAppointment("");
          }
        }}
        initialPatientId={selectedPatientForAppointment}
        onAppointmentUpdated={() => {
          // Refresh appointments list if needed
          fetchQueueData();
        }}
      />

      {/* Check In Dialog - Appointment-based */}
      <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Check In Appointment</DialogTitle>
            <DialogDescription>
              Check in a patient using their scheduled appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-appointment">Appointment *</Label>
              <Select
                value={selectedPatientId}
                onValueChange={setSelectedPatientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentsList
                    .filter((apt) => apt.status === "scheduled")
                    .map((apt) => {
                      const optionId = (apt.mongoId ?? apt.id) as string;
                      return (
                        <SelectItem key={optionId} value={optionId}>
                          {apt.patientName} • {formatAppointmentTime(apt.date, apt.time)} (
                          {apt.reason || "General consultation"})
                      </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {appointmentsList.filter((apt) => apt.status === "scheduled").length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No scheduled appointments available. Please schedule an appointment first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkin-reason">Reason</Label>
              <Input
                id="checkin-reason"
                value={checkInReason}
                onChange={(e) => setCheckInReason(e.target.value)}
                placeholder="General Consultation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkin-priority">Priority</Label>
              <Select
                value={checkInPriority}
                onValueChange={setCheckInPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCheckInDialog(false);
                setSelectedPatientId("");
                setCheckInReason("");
                setCheckInPriority("medium");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !selectedPatientId}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isCheckingIn ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
