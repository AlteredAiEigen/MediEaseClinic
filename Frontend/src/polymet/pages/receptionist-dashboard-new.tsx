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
  MailIcon,
  RefreshCwIcon,
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
import { Textarea } from "@/components/ui/textarea";
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
import { todayLocalYYYYMMDD } from "@/lib/date";
import { WhatsAppMessaging } from "@/polymet/components/whatsapp-messaging";

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
  const [communicationConsentsReceptionist, setCommunicationConsentsReceptionist] = useState({
    whatsapp: false,
    email: false,
    sms: false,
    phoneCall: false,
  });
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    age: "",  // Mandatory field
    email: "",
    phone: "",
    dateOfBirth: "",  // Optional - month/year only (YYYY-MM format)
    gender: "",
    address: "",
    bloodGroup: "",
    emergencyContact: "",
    emergencyPhone: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] =
    useState<"patients" | "appointments">("patients");
  
  // Lab checkout dialog state
  const [labCheckoutDialog, setLabCheckoutDialog] = useState(false);
  const [selectedLabAppointment, setSelectedLabAppointment] = useState<any>(null);
  const [selectedLabQueueEntryId, setSelectedLabQueueEntryId] = useState<string | null>(null);
  const [labPatientEmail, setLabPatientEmail] = useState<string>("");
  const [isLoadingLabPatient, setIsLoadingLabPatient] = useState(false);
  const [isProcessingLabCheckout, setIsProcessingLabCheckout] = useState(false);
  
  // Vitals dialog state
  const [vitalsDialog, setVitalsDialog] = useState(false);
  const [selectedAppointmentForVitals, setSelectedAppointmentForVitals] = useState<any>(null);
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    weight: "",
    bloodGlucose: "",
    oxygenSaturation: "",
    respiratoryRate: "",
    notes: "",
  });
  const [queueDetailTab, setQueueDetailTab] =
    useState<"checked-in" | "consultation" | "lab-results">("checked-in");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [processingAppointmentId, setProcessingAppointmentId] = useState<string | null>(null);
  const [resendingConsentId, setResendingConsentId] = useState<string | null>(null);
  const [reconsentCooldowns, setReconsentCooldowns] = useState<Record<string, number>>({});
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
      // Use trailing slash to avoid 307 redirects that can interfere with some proxies/caches.
      const response = await get<{ queue?: QueueEntry[]; data?: QueueEntry[] | QueueEntry }>("/api/queue/");
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
        // Backend may return historical entries; hide already checked-out/inactive ones client-side.
        const filtered = queueData.filter((entry: any) => {
          const status = String(entry?.status || "").toLowerCase();
          if (status === "checked-out" || status === "checked_out") return false;
          if (entry && typeof entry === "object" && "is_active" in entry) {
            return Boolean((entry as any).is_active);
          }
          if (entry && typeof entry === "object" && "isActive" in entry) {
            return Boolean((entry as any).isActive);
          }
          return true;
        });
        setQueueList(filtered);
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
    if (!newPatient.firstName || !newPatient.phone || !newPatient.age) {
      alert("Please fill in all required fields (First Name, Phone, Age)");
      return;
    }

    if (!agreedToTermsReceptionist) {
      alert("Please confirm that the patient has been informed about data security terms before registering.");
      return;
    }

    try {
      setIsAddingPatient(true);
      
      // Calculate dateOfBirth from age if provided and dateOfBirth not set
      // Format: YYYY-MM (month/year only) or calculate from age
      let dateOfBirthValue: string | undefined = undefined;
      
      if (newPatient.dateOfBirth) {
        // User provided month/year (YYYY-MM format)
        dateOfBirthValue = newPatient.dateOfBirth;
      } else if (newPatient.age) {
        // Calculate dateOfBirth from age (use January 1st as default)
        const age = parseInt(newPatient.age);
        if (!isNaN(age) && age > 0) {
          const today = new Date();
          const birthYear = today.getFullYear() - age;
          dateOfBirthValue = `${birthYear}-01-01`;  // Use January 1st as default
        }
      }

      const payload = {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName || undefined,  // Optional
        email: newPatient.email || `${newPatient.firstName.toLowerCase()}.${(newPatient.lastName || "").toLowerCase()}@example.com`,
        phone: `+91 ${newPatient.phone.replace(/\s/g, '')}`.trim(),
        dateOfBirth: dateOfBirthValue,  // Optional - can be calculated from age
        age: newPatient.age,  // Mandatory
        gender: newPatient.gender || undefined,
        address: newPatient.address || undefined,
        bloodGroup: newPatient.bloodGroup || undefined,
        emergencyContact: newPatient.emergencyContact || undefined,  // Optional
        emergencyContactPhone: newPatient.emergencyPhone ? `+91 ${newPatient.emergencyPhone.replace(/\s/g, '')}`.trim() : undefined,  // Optional
        agreedToDataStorage: true, // Patient has agreed via checkbox
        // Communication consent preferences
        consentWhatsApp: communicationConsentsReceptionist.whatsapp,
        consentEmail: communicationConsentsReceptionist.email,
        consentSMS: communicationConsentsReceptionist.sms,
        consentPhoneCall: communicationConsentsReceptionist.phoneCall,
      };

      const response = await post<{ patient: any }>("/api/patients", payload);

      if (response.success && response.data?.patient) {
        const newPatientId = response.data.patient._id;
        setAddPatientDialog(false);
        setNewPatient({
          firstName: "",
          lastName: "",
          age: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          gender: "",
          address: "",
          bloodGroup: "",
          emergencyContact: "",
          emergencyPhone: "",
        });
        setAgreedToTermsReceptionist(false);
        setCommunicationConsentsReceptionist({
          whatsapp: false,
          email: false,
          sms: false,
          phoneCall: false,
        });
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

  // Handle lab appointment direct checkout
  const handleLabCheckoutClick = async (appointment: any, queueEntryId?: string) => {
    setSelectedLabAppointment(appointment);
    setSelectedLabQueueEntryId(queueEntryId || null);
    setLabCheckoutDialog(true);
    setIsLoadingLabPatient(true);
    setLabPatientEmail("");

    try {
      // Fetch patient details to get MediEase email
      // The backend will auto-generate it if missing when fetching the patient
      const patientId = appointment.patientId;
      if (patientId) {
        const response = await get(`/api/patients/${patientId}`);
        if (response.success && response.data) {
          // Handle both response structures: {patient: {...}} or just {...}
          const patient = response.data?.patient || response.data;
          const email = patient?.medieaseClinicEmail;
          
          if (email) {
            setLabPatientEmail(email);
          } else {
            // If email is still missing after backend auto-generation attempt
            setLabPatientEmail("Unable to generate email. Patient may be missing required information (name or date of birth).");
          }
        } else {
          setLabPatientEmail("Patient not found");
        }
      } else {
        setLabPatientEmail("Invalid patient ID");
      }
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      setLabPatientEmail("Unable to fetch email");
    } finally {
      setIsLoadingLabPatient(false);
    }
  };

  const handleConfirmLabCheckout = async () => {
    if (!selectedLabAppointment) return;

    setIsProcessingLabCheckout(true);
    try {
      const appointmentId = selectedLabAppointment.mongoId || selectedLabAppointment.id;
      
      // Find queue entry if not already provided
      let queueEntryId = selectedLabQueueEntryId;
      if (!queueEntryId) {
        // Try to find queue entry by appointment ID - check all statuses, not just waiting/in-consultation
        const queueEntry = queueList.find((entry) => {
          const entryAppointmentId = resolveAppointmentIdForEntry(entry);
          return entryAppointmentId === appointmentId;
        });
        if (queueEntry && queueEntry._id) {
          queueEntryId = queueEntry._id;
        }
      }
      
      // Check out from queue first (if queue entry exists) - this is critical for lab appointments
      // The queue entry must be marked as "checked-out" so it doesn't appear in checkout tab
      // The backend's check_out_patient function already updates the appointment status to "completed",
      // so we don't need to update it again (and doing so would trigger queue status sync that overrides "checked-out")
      if (queueEntryId) {
        try {
          const checkOutResponse = await post(`/api/queue/${queueEntryId}/check-out`, {});
          if (!checkOutResponse.success) {
            throw new Error(checkOutResponse.message || "Failed to check out from queue");
          }
          // Queue entry is now marked as checked-out and is_active = false
          // Backend also updates appointment status to "completed" automatically
          // No need to update appointment status again - it would cause queue status sync issues
        } catch (queueError) {
          // If queue check-out fails, throw error to prevent completion
          console.error("Error checking out from queue:", queueError);
          throw new Error(`Failed to check out from queue: ${queueError instanceof Error ? queueError.message : "Unknown error"}`);
        }
      } else {
        // If no queue entry found, update appointment status manually
        // This handles edge cases where queue entry might not exist
        const response = await patch(`/api/appointments/${appointmentId}/status`, {
          status: "completed"
        });
        if (!response.success) {
          throw new Error(response.message || "Failed to complete appointment");
        }
      }
      
      // If we got here, checkout was successful
      // (either via queue check-out endpoint which handles appointment update, or manual appointment update)
      toast({
        title: "Lab Appointment Completed",
        description: `Please send the lab report to: ${labPatientEmail}`,
      });
      setLabCheckoutDialog(false);
      setSelectedLabAppointment(null);
      setSelectedLabQueueEntryId(null);
      // Refresh data to ensure UI is updated
      await Promise.all([fetchTodayAppointments(), fetchQueueData(), fetchQueueStats()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete lab checkout";
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: message,
      });
    } finally {
      setIsProcessingLabCheckout(false);
    }
  };

  // Handle opening vitals dialog
  const handleAddVitalsClick = (appointment: any) => {
    setSelectedAppointmentForVitals(appointment);
    setVitalsDialog(true);
    // Reset form
    setVitalsForm({
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      bloodGlucose: "",
      oxygenSaturation: "",
      respiratoryRate: "",
      notes: "",
    });
  };

  // Handle resending consent email
  const handleResendConsent = async (appointment: any) => {
    const appointmentMongoId =
      appointment?.mongoId || appointment?.id || appointment?.appointmentId;
    if (!appointmentMongoId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to identify the selected appointment.",
      });
      return;
    }

    // Check cooldown
    const cooldownEndTime = reconsentCooldowns[appointmentMongoId];
    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      const remainingMinutes = Math.ceil((cooldownEndTime - Date.now()) / 60000);
      toast({
        variant: "destructive",
        title: "Please wait",
        description: `Reconsent is on cooldown. Please wait ${remainingMinutes} minute(s) before trying again.`,
      });
      return;
    }

    try {
      setResendingConsentId(appointmentMongoId);
      const response = await post(`/api/consent/resend-appointment-consent?appointmentId=${appointmentMongoId}`);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Consent email has been resent to the patient.",
        });
        
        // Set 5-minute cooldown
        const cooldownEnd = Date.now() + 5 * 60 * 1000; // 5 minutes
        setReconsentCooldowns((prev) => ({
          ...prev,
          [appointmentMongoId]: cooldownEnd,
        }));
        
        // Refresh appointments to get updated consent status
        fetchTodayAppointments();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to resend consent email.",
        });
      }
    } catch (error: any) {
      console.error("Failed to resend consent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to resend consent email. Please try again.",
      });
    } finally {
      setResendingConsentId(null);
    }
  };

  // Cleanup expired cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setReconsentCooldowns((prev) => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;
        
        Object.keys(updated).forEach((key) => {
          if (updated[key] <= now) {
            delete updated[key];
            changed = true;
          }
        });
        
        return changed ? updated : prev;
      });
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle saving vitals
  const handleSaveVitals = async () => {
    if (!selectedAppointmentForVitals?.patientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Patient ID not found",
      });
      return;
    }

    setIsSavingVitals(true);
    try {
      // Prepare vitals payload - all fields are optional
      const vitalsPayload: any = {};
      if (vitalsForm.bloodPressure) vitalsPayload.bloodPressure = vitalsForm.bloodPressure;
      if (vitalsForm.heartRate) vitalsPayload.heartRate = vitalsForm.heartRate;
      if (vitalsForm.temperature) vitalsPayload.temperature = vitalsForm.temperature;
      if (vitalsForm.weight) vitalsPayload.weight = vitalsForm.weight;
      if (vitalsForm.bloodGlucose) vitalsPayload.bloodGlucose = vitalsForm.bloodGlucose;
      if (vitalsForm.oxygenSaturation) vitalsPayload.oxygenSaturation = vitalsForm.oxygenSaturation;
      if (vitalsForm.respiratoryRate) vitalsPayload.respiratoryRate = vitalsForm.respiratoryRate;
      if (vitalsForm.notes) vitalsPayload.notes = vitalsForm.notes;

      // All vitals are optional - allow saving even if empty (user can close dialog without saving)
      // Only save if at least one field is filled
      if (Object.keys(vitalsPayload).length === 0) {
        // User didn't enter any vitals - just close the dialog
        setVitalsDialog(false);
        setSelectedAppointmentForVitals(null);
        setIsSavingVitals(false);
        return;
      }

      const response = await post(
        `/api/patient-vitals/${selectedAppointmentForVitals.patientId}`,
        vitalsPayload
      );

      if (response.success) {
        toast({
          title: "Vitals Saved",
          description: "Patient vitals have been recorded successfully",
        });
        setVitalsDialog(false);
        setSelectedAppointmentForVitals(null);
        setVitalsForm({
          bloodPressure: "",
          heartRate: "",
          temperature: "",
          weight: "",
          bloodGlucose: "",
          oxygenSaturation: "",
          respiratoryRate: "",
          notes: "",
        });
      } else {
        throw new Error(response.message || "Failed to save vitals");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save vitals";
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: message,
      });
    } finally {
      setIsSavingVitals(false);
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
      const today = todayLocalYYYYMMDD();
      const response = await get(`/api/appointments?date=${today}&limit=100`);
      if (response.success) {
        const rawAppointments = extractList<any>(response.data);
        const mappedAppointments = rawAppointments.map((apt: any) => {
          // Debug: Log consent status for troubleshooting
          if (apt.appointmentId === "APT58107446" || apt.consentStatus) {
            console.log(`📋 Appointment ${apt.appointmentId || apt._id}: consentStatus =`, apt.consentStatus, "raw apt:", apt);
          }
          // Extract valid MongoDB ObjectId (must be 24 hex characters)
          const mongoId = extractMongoObjectId(apt);
          const appointmentIdentifier = normalizeId(apt.appointmentId);
          
          // Use mongoId if available, otherwise fallback (but log warning)
          if (!mongoId) {
            console.warn("⚠️ No valid MongoDB _id found for appointment:", apt);
          }

          const doctorId = normalizeId(apt.doctorId) ?? normalizeId(apt.doctor?._id);
          const reason = (apt.reason || "General Consultation").toLowerCase();
          const type = (apt.type || apt.appointmentType || "").toLowerCase();
          const doctorName = apt.doctorName ||
            apt.doctor?.fullName ||
            [apt.doctor?.firstName, apt.doctor?.lastName].filter(Boolean).join(" ");
          
          // Detect lab appointment: explicit bookingKind OR no doctor + lab-related keywords
          const isLabByBookingKind = apt.bookingKind === "lab-test";
          const hasNoDoctor = !doctorId || !doctorName || doctorName.toLowerCase().includes("not assigned");
          const isLabByIndicators = hasNoDoctor && (
            reason.includes("blood test") ||
            reason.includes("blood") ||
            reason.includes("lab") ||
            reason.includes("test") ||
            reason.includes("diagnostic") ||
            reason.includes("x-ray") ||
            reason.includes("scan") ||
            reason.includes("ultrasound") ||
            reason.includes("mri") ||
            reason.includes("ct") ||
            type.includes("test") ||
            type.includes("lab") ||
            type.includes("diagnostic")
          );
          
          return {
            id: mongoId ?? appointmentIdentifier ?? Math.random().toString(36).slice(2),
            mongoId: mongoId ?? undefined, // Only set if valid ObjectId
            appointmentId: appointmentIdentifier,
            patientId: normalizeId(apt.patientId) ?? apt.patientId,
            patientName: apt.patientName || apt.patient?.fullName || "Unknown Patient",
            time: apt.time ?? "—",
            date: apt.date ?? today,
            reason: apt.reason || "General Consultation",
            status: apt.status ?? "scheduled",
            type: apt.type || apt.appointmentType,
            doctorId: doctorId,
            doctorName: doctorName || "Not assigned",
            bookingKind: isLabByBookingKind || isLabByIndicators ? "lab-test" : "doctor",
            consentStatus: apt.consentStatus !== undefined && apt.consentStatus !== null ? apt.consentStatus : "pending",
            consentDate: apt.consentDate,
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

  // Poll appointments to update consent status in real-time
  useEffect(() => {
    // Immediate refresh on mount
    fetchTodayAppointments();
    
    // More aggressive polling for consent updates - check every 1 second
    const interval = setInterval(() => {
      fetchTodayAppointments();
    }, 1000); // Poll every 1 second to catch consent status updates instantly
    
    // Refresh when tab becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTodayAppointments();
      }
    };
    
    // Refresh on window focus
    const handleFocus = () => {
      fetchTodayAppointments();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchTodayAppointments]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    const handleQueueUpdate = async () => {
      try {
        if (lastMessage.type === 'patient_checked_in' ||
            lastMessage.type === 'patient_status_updated' ||
            lastMessage.type === 'queue_reordered' ||
            lastMessage.type === 'appointment_status_updated' ||
            lastMessage.type === 'consent_updated') {
          // Refresh queue data and stats silently (no loading state)
          console.log('🔄 Refreshing queue data due to:', lastMessage.type);
          await Promise.all([
            fetchQueueData(),
            fetchQueueStats(),
            fetchTodayAppointments() // Also refresh appointments for consent updates
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

const todayDate = todayLocalYYYYMMDD();
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

// Helper function to check if an entry is a lab appointment
const isLabQueueEntry = (entry: QueueEntry): boolean => {
  const hasNoDoctor = !entry.doctor || entry.doctor === null;
  const appointment = appointmentByPatientId.get(entry.patient._id);
  const isLabByAppointment = 
    appointment?.appointmentType === "lab-test" ||
    appointment?.bookingKind === "lab-test";
  return hasNoDoctor || isLabByAppointment;
};

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

// Sort queue entries by queue_number to respect doctor's ordering
// Exclude lab appointments from waiting - they go to Lab Results tab
const checkInEntries = queueList
  .filter((entry) => entry.status === "waiting" && !isLabQueueEntry(entry))
  .sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));

const consultationEntries = queueList
  .filter((entry) => entry.status === "in-consultation")
  .sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));

const checkoutEntries = queueList
  .filter(
    (entry) => {
      // Exclude inactive entries (checked out entries have is_active = false)
      if (entry.is_active === false) {
        return false;
      }
      
      // Exclude lab appointments - they go through direct checkout and shouldn't appear here
      // Check multiple ways to identify lab appointments:
      // 1. No doctor assigned (lab appointments don't have doctors)
      const hasNoDoctor = !entry.doctor || entry.doctor === null;
      
      // 2. Check appointment data if available
      const appointment = appointmentByPatientId.get(entry.patient._id);
      const isLabByAppointment = 
        appointment?.appointmentType === "lab-test" ||
        appointment?.bookingKind === "lab-test";
      
      // 3. Check reason field for lab-related keywords (defensive check)
      const reason = (entry.reason || "").toLowerCase();
      const isLabByReason = 
        reason.includes("lab") ||
        reason.includes("test") ||
        reason.includes("diagnostic") ||
        reason.includes("blood") ||
        reason.includes("x-ray");
      
      // 4. Use the helper function
      const isLab = isLabQueueEntry(entry);
      
      // Exclude if any of these indicate it's a lab appointment
      // Priority: if no doctor AND reason suggests lab, it's definitely a lab appointment
      if ((hasNoDoctor && isLabByReason) || isLabByAppointment || isLab) {
        return false;
      }
      
      // Only include doctor appointments in checkout status
      // Also exclude entries that are already checked-out (defensive)
      if (entry.status === "checked-out" || entry.status === "checked_out") {
        return false;
      }
      
      return (
        entry.status === "completed" ||
        entry.status === "checkout" ||
        entry.status === "checkout-pending"
      );
    }
  )
  .sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));

// Filter lab appointments - these should appear in Lab Results tab
// Lab appointments are identified by: no doctor, or appointmentType/bookingKind indicates lab-test
// Include all lab appointments that haven't been checked out (regardless of status: waiting, in-consultation, etc.)
const labResultsEntries = queueList
  .filter((entry) => {
    // Use the helper function to identify lab appointments
    const isLab = isLabQueueEntry(entry);
    
    // Exclude checked-out entries
    const isCheckedOut = entry.status === "checked-out" || entry.status === "checked_out";
    const isActive = entry.is_active !== false;
    
    return isLab && !isCheckedOut && isActive;
  })
  .sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));

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
const filteredLabResultsEntries = shouldFilterQueue
  ? labResultsEntries.filter(matchesQueueEntry)
  : labResultsEntries;

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

  try {
    setIsCheckingOut(true);
    const queueId = selectedQueueEntry.queue_id;
    const queueEntryId = selectedQueueEntry._id;

    if (!queueEntryId) {
      throw new Error("Queue entry ID not found");
    }

    // Single backend call: checkout with prescription file (if provided)
    // All processing (upload, analysis, status update) happens in the backend
    const formData = new FormData();
    if (prescriptionFile) {
      formData.append("prescription_file", prescriptionFile);
    }
    if (selectedQueueEntry.reason) {
      formData.append("notes", selectedQueueEntry.reason);
    }
    
    // Call checkout endpoint - it handles everything in the backend
    // If no file, FormData will be empty but that's fine - backend handles Optional[UploadFile]
    const checkOutResponse = await post(`/api/queue/${queueEntryId}/check-out`, formData);
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
        // Also remove any other active entries for the same patient (defensive against duplicates).
        const samePatient =
          entry.patient?._id &&
          selectedQueueEntry?.patient?._id &&
          String(entry.patient._id) === String(selectedQueueEntry.patient._id);
        const samePatientId =
          entry.patient?.patientId &&
          selectedQueueEntry?.patient?.patientId &&
          String(entry.patient.patientId) === String(selectedQueueEntry.patient.patientId);

        return !matchesId && !matchesQueueId && !samePatient && !samePatientId;
      })
    );
 
    // Refresh data immediately to ensure UI updates (best-effort; don't show checkout failed if refresh fails)
    try {
      await Promise.all([fetchQueueData(), fetchQueueStats(), fetchTodayAppointments()]);
    } catch (refreshErr) {
      console.warn("⚠️ Post-checkout refresh failed:", refreshErr);
      // Still try to refresh queue data even if other calls fail
      try {
        await fetchQueueData();
      } catch (queueErr) {
        console.warn("⚠️ Queue refresh also failed:", queueErr);
      }
    }
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
                const isLabAppointment = 
                  appointment.appointmentType === "lab-test" ||
                  appointment.bookingKind === "lab-test";
                return (
                  <div
                    key={appointmentKey}
                    className={`space-y-3 rounded-lg border p-3 text-sm ${
                      isLabAppointment 
                        ? "border-purple-200/70 bg-purple-50/30 dark:border-purple-800/60 dark:bg-purple-900/10" 
                        : "border-slate-200/70 dark:border-slate-700/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {appointment.patientName}
                          </p>
                          {isLabAppointment && (
                            <Badge className="border-0 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                              🔬 Lab Test
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {appointment.reason || "General consultation"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isLabAppointment ? "Lab / Diagnostic" : `Doctor: ${appointment.doctorName || "Not assigned"}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className="text-sm font-semibold text-foreground">
                          {formattedTime}
                        </span>
                        {isLabAppointment ? (
                          // Lab appointments now go through check-in first
                          appointment.status === "completed" ? (
                            <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              Completed
                            </Badge>
                          ) : isInQueue ? (
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              In Queue
                            </Badge>
                          ) : (
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
                          )
                        ) : isInQueue ? (
                          // Already in queue - show status badge
                          <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            In Queue
                          </Badge>
                        ) : (
                          // Not in queue - always show check-in button for non-lab appointments
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
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50">
                      {/* Consent Status and Reconsent */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheckIcon className="h-3.5 w-3.5 text-slate-500" />
                          <Badge
                            variant="outline"
                            className={`text-xs px-2.5 py-1 font-medium ${
                              appointment.consentStatus === "accepted"
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                : appointment.consentStatus === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                            }`}
                          >
                            {appointment.consentStatus === "accepted"
                              ? "Approved"
                              : appointment.consentStatus === "rejected"
                              ? "Rejected"
                              : "Pending"}
                          </Badge>
                        </div>
                        {(() => {
                          const appointmentMongoId = appointment.mongoId || appointment.id || appointment.appointmentId;
                          const isOnCooldown = reconsentCooldowns[appointmentMongoId] && Date.now() < reconsentCooldowns[appointmentMongoId];
                          const isDisabled = appointment.consentStatus === "accepted" || isOnCooldown || resendingConsentId === appointmentMongoId;
                          const cooldownRemaining = isOnCooldown 
                            ? Math.ceil((reconsentCooldowns[appointmentMongoId] - Date.now()) / 60000)
                            : 0;
                          
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs px-2 py-1 h-auto ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "text-orange-600 hover:text-orange-800 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20 dark:border-orange-800"
                              }`}
                              disabled={isDisabled}
                              onClick={() => handleResendConsent(appointment)}
                              title={isOnCooldown ? `Reconsent available in ${cooldownRemaining} minute(s)` : undefined}
                            >
                              {resendingConsentId === appointmentMongoId ? (
                                <>
                                  <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                                  Sending...
                                </>
                              ) : isOnCooldown ? (
                                <>
                                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                                  {cooldownRemaining}m
                                </>
                              ) : (
                                <>
                                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                                  Reconsent
                                </>
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                      {/* Add Vitals Button */}
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleAddVitalsClick(appointment)}
                        >
                          <ActivityIcon className="mr-1 h-3 w-3" />
                          Add Vitals
                        </Button>
                      </div>
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
                const isLabAppointment = 
                  appointment.appointmentType === "lab-test" ||
                  appointment.bookingKind === "lab-test";
                return (
                  <div
                    key={appointmentKey}
                    className={`rounded-lg border p-3 shadow-sm ${
                      isLabAppointment
                        ? "border-purple-200 bg-purple-50/80 dark:border-purple-800/60 dark:bg-purple-900/20"
                        : "border-emerald-100 bg-white/80 dark:border-emerald-800/60 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {appointment.patientName}
                          </p>
                          {isLabAppointment && (
                            <Badge className="border-0 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                              🔬 Lab
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {appointment.reason || "General consultation"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isLabAppointment ? "Lab / Diagnostic" : `Doctor: ${appointment.doctorName || "Not assigned"}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formattedTime}
                        </span>
                        {isLabAppointment ? (
                          // Lab appointments now go through check-in first
                          appointment.status === "completed" ? (
                            <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              Completed
                            </Badge>
                          ) : isInQueue ? (
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              In Queue
                            </Badge>
                          ) : (
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
                          )
                        ) : isInQueue ? (
                          // Already in queue - show status badge
                          <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            In Queue
                          </Badge>
                        ) : (
                          // Not in queue - always show check-in button for non-lab appointments
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
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50">
                      {/* Consent Status and Reconsent */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheckIcon className="h-3.5 w-3.5 text-slate-500" />
                          <Badge
                            variant="outline"
                            className={`text-xs px-2.5 py-1 font-medium ${
                              appointment.consentStatus === "accepted"
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                : appointment.consentStatus === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                            }`}
                          >
                            {appointment.consentStatus === "accepted"
                              ? "Approved"
                              : appointment.consentStatus === "rejected"
                              ? "Rejected"
                              : "Pending"}
                          </Badge>
                        </div>
                        {(() => {
                          const appointmentMongoId = appointment.mongoId || appointment.id || appointment.appointmentId;
                          const isOnCooldown = reconsentCooldowns[appointmentMongoId] && Date.now() < reconsentCooldowns[appointmentMongoId];
                          const isDisabled = appointment.consentStatus === "accepted" || isOnCooldown || resendingConsentId === appointmentMongoId;
                          const cooldownRemaining = isOnCooldown 
                            ? Math.ceil((reconsentCooldowns[appointmentMongoId] - Date.now()) / 60000)
                            : 0;
                          
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs px-2 py-1 h-auto ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "text-orange-600 hover:text-orange-800 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20 dark:border-orange-800"
                              }`}
                              disabled={isDisabled}
                              onClick={() => handleResendConsent(appointment)}
                              title={isOnCooldown ? `Reconsent available in ${cooldownRemaining} minute(s)` : undefined}
                            >
                              {resendingConsentId === appointmentMongoId ? (
                                <>
                                  <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                                  Sending...
                                </>
                              ) : isOnCooldown ? (
                                <>
                                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                                  {cooldownRemaining}m
                                </>
                              ) : (
                                <>
                                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                                  Reconsent
                                </>
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                      {/* Add Vitals Button */}
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleAddVitalsClick(appointment)}
                        >
                          <ActivityIcon className="mr-1 h-3 w-3" />
                          Add Vitals
                        </Button>
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
                : queueDetailTab === "consultation"
                ? filteredConsultationEntries.length
                : filteredLabResultsEntries.length}
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
              <button
                type="button"
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  queueDetailTab === "lab-results"
                    ? "bg-purple-500 text-white shadow"
                    : "text-purple-600 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-slate-800"
                }`}
                onClick={() => setQueueDetailTab("lab-results")}
              >
                Lab Results
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
                    // Check if this is a lab appointment
                    // Priority: appointmentType > bookingKind > no doctor + keywords
                    const isLabAppointment = 
                      appointment?.appointmentType === "lab-test" ||
                      appointment?.bookingKind === "lab-test" || 
                      (!appointment?.doctorId && (
                        (appointment?.reason || "").toLowerCase().includes("lab") ||
                        (appointment?.reason || "").toLowerCase().includes("test") ||
                        (appointment?.reason || "").toLowerCase().includes("diagnostic") ||
                        (appointment?.reason || "").toLowerCase().includes("blood") ||
                        (appointment?.reason || "").toLowerCase().includes("x-ray")
                      )) ||
                      // Also check if queue entry has no doctor (lab appointments don't have doctors)
                      (!entry.doctor || entry.doctor === null);
                    return (
                      <div
                        key={entry.queue_id}
                        className={`rounded-lg border p-3 shadow-sm ${
                          isLabAppointment
                            ? "border-purple-200 bg-purple-50/80 dark:border-purple-800/60 dark:bg-purple-900/20"
                            : "border-sky-100 bg-white/80 dark:border-sky-800/60 dark:bg-slate-900"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {entry.patient.fullName}
                              </span>
                              {isLabAppointment && (
                                <Badge className="border-0 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                                  🔬 Lab
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {appointment?.time
                                ? formatAppointmentTime(appointment.date, appointment.time)
                                : "Walk-in"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                              {entry.reason || "General consultation"},{" "}
                              {isLabAppointment ? "Lab / Diagnostic" : (appointment?.doctorName || "Any doctor")}
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
                            {isLabAppointment ? (
                              // Show checkout button for lab appointments (with or without full appointment object)
                              appointment ? (
                                <Button
                                  size="sm"
                                  className="bg-purple-600 text-white hover:bg-purple-700"
                                  disabled={isProcessingLabCheckout}
                                  onClick={() => handleLabCheckoutClick(appointment, entry._id)}
                                >
                                  {isProcessingLabCheckout ? (
                                    <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircleIcon className="mr-2 h-3 w-3" />
                                  )}
                                  Direct Checkout
                                </Button>
                              ) : appointmentId ? (
                                // If appointment object not loaded but we have appointmentId, create minimal object
                                <Button
                                  size="sm"
                                  className="bg-purple-600 text-white hover:bg-purple-700"
                                  disabled={isProcessingLabCheckout}
                                  onClick={() => {
                                    // Create minimal appointment object from entry data
                                    const minimalAppointment = {
                                      id: appointmentId,
                                      mongoId: appointmentId,
                                      patientId: entry.patient._id,
                                      patientName: entry.patient.fullName,
                                      reason: entry.reason || "Lab Test",
                                      appointmentType: "lab-test",
                                      bookingKind: "lab-test"
                                    };
                                    handleLabCheckoutClick(minimalAppointment, entry._id);
                                  }}
                                >
                                  {isProcessingLabCheckout ? (
                                    <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircleIcon className="mr-2 h-3 w-3" />
                                  )}
                                  Direct Checkout
                                </Button>
                              ) : null
                            ) : (
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
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : queueDetailTab === "consultation" ? (
                filteredConsultationEntries.length === 0 ? (
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
                )
              ) : filteredLabResultsEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-purple-200 bg-white/80 p-6 text-center dark:border-purple-800/60 dark:bg-slate-900/50">
                  <CheckCircleIcon className="mb-3 h-8 w-8 text-purple-300" />
                  <p className="text-sm font-semibold text-purple-700">
                    No lab appointments waiting
                  </p>
                  <p className="mt-1 text-xs text-purple-600/80">
                    Lab appointments checked in will appear here for direct checkout.
                  </p>
                </div>
              ) : (
                filteredLabResultsEntries.map((entry) => {
                  const appointment = appointmentByPatientId.get(entry.patient._id);
                  const patientMongoId = entry.patient?._id;
                  const appointmentId = resolveAppointmentIdForEntry(entry);
                  // Confirm this is a lab appointment
                  const isLabAppointment = 
                    appointment?.appointmentType === "lab-test" ||
                    appointment?.bookingKind === "lab-test" || 
                    (!appointment?.doctorId && (
                      (appointment?.reason || "").toLowerCase().includes("lab") ||
                      (appointment?.reason || "").toLowerCase().includes("test") ||
                      (appointment?.reason || "").toLowerCase().includes("diagnostic") ||
                      (appointment?.reason || "").toLowerCase().includes("blood") ||
                      (appointment?.reason || "").toLowerCase().includes("x-ray")
                    )) ||
                    (!entry.doctor || entry.doctor === null);
                  
                  return (
                    <div
                      key={entry.queue_id}
                      className="rounded-lg border border-purple-200 bg-purple-50/80 p-3 shadow-sm dark:border-purple-800/60 dark:bg-purple-900/20"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {entry.patient.fullName}
                            </span>
                            <Badge className="border-0 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                              🔬 Lab
                            </Badge>
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {appointment?.time
                              ? formatAppointmentTime(appointment.date, appointment.time)
                              : "Walk-in"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {entry.reason || "Lab Test"}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
                          >
                            {entry.status === "waiting" ? "Waiting" : 
                             entry.status === "in-consultation" ? "In Progress" : 
                             entry.status}
                          </Badge>
                        </div>
                      </div>
                      {patientMongoId && (
                        <div className="mt-2 flex items-center justify-end gap-2">
                          {appointment ? (
                            <Button
                              size="sm"
                              className="bg-purple-600 text-white hover:bg-purple-700"
                              disabled={isProcessingLabCheckout}
                              onClick={() => handleLabCheckoutClick(appointment, entry._id)}
                            >
                              {isProcessingLabCheckout ? (
                                <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircleIcon className="mr-2 h-3 w-3" />
                              )}
                              Direct Checkout
                            </Button>
                          ) : appointmentId ? (
                            <Button
                              size="sm"
                              className="bg-purple-600 text-white hover:bg-purple-700"
                              disabled={isProcessingLabCheckout}
                              onClick={() => {
                                const minimalAppointment = {
                                  id: appointmentId,
                                  mongoId: appointmentId,
                                  patientId: entry.patient._id,
                                  patientName: entry.patient.fullName,
                                  reason: entry.reason || "Lab Test",
                                  appointmentType: "lab-test",
                                  bookingKind: "lab-test"
                                };
                                handleLabCheckoutClick(minimalAppointment, entry._id);
                              }}
                            >
                              {isProcessingLabCheckout ? (
                                <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircleIcon className="mr-2 h-3 w-3" />
                              )}
                              Direct Checkout
                            </Button>
                          ) : null}
                        </div>
                      )}
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
            <div className="w-full">
              <WhatsAppMessaging />
            </div>
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
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  placeholder="Doe (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (in years) *</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="150"
                  value={newPatient.age}
                  onChange={(e) => {
                    // Only update the age value while typing
                    setNewPatient({ ...newPatient, age: e.target.value });
                  }}
                  onBlur={(e) => {
                    // Calculate dateOfBirth when user leaves the age field
                    // Always recalculate if age is provided, regardless of existing dateOfBirth
                    const ageValue = e.target.value;
                    if (ageValue) {
                      const age = parseInt(ageValue);
                      if (!isNaN(age) && age > 0) {
                        const today = new Date();
                        const birthYear = today.getFullYear() - age;
                        // Use January as default month (or preserve existing month if dateOfBirth already set)
                        let monthYear = `${birthYear}-01`;
                        if (newPatient.dateOfBirth) {
                          // Preserve the month from existing dateOfBirth if it exists
                          const existingMonth = newPatient.dateOfBirth.substring(5, 7);
                          monthYear = `${birthYear}-${existingMonth}`;
                        }
                        setNewPatient((prev) => ({ ...prev, dateOfBirth: monthYear }));
                      }
                    }
                  }}
                  placeholder="Enter age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth (Month/Year)</Label>
                <Input
                  id="dateOfBirth"
                  type="month"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => {
                    setNewPatient({ ...newPatient, dateOfBirth: e.target.value });
                    // Recalculate age if dateOfBirth changes
                    if (e.target.value) {
                      const [year, month] = e.target.value.split('-');
                      const birthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      setNewPatient((prev) => ({ ...prev, age: age > 0 ? age.toString() : prev.age, dateOfBirth: e.target.value }));
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Optional - Month and year only</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

            {/* Emergency Contact Section */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Emergency Contact (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={newPatient.emergencyContact}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, emergencyContact: e.target.value })
                    }
                    placeholder="Enter contact name (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md bg-muted">
                      +91
                    </span>
                    <Input
                      id="emergencyPhone"
                      value={newPatient.emergencyPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setNewPatient({ ...newPatient, emergencyPhone: formatted });
                      }}
                      placeholder="98765 43210 (optional)"
                      maxLength={11}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Consent */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      Communication Preferences
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Select how patient would like to receive communications:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentWhatsAppReceptionist"
                          checked={communicationConsentsReceptionist.whatsapp}
                          onCheckedChange={(checked) =>
                            setCommunicationConsentsReceptionist((prev) => ({
                              ...prev,
                              whatsapp: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentWhatsAppReceptionist"
                          className="text-xs font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          WhatsApp
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentEmailReceptionist"
                          checked={communicationConsentsReceptionist.email}
                          onCheckedChange={(checked) =>
                            setCommunicationConsentsReceptionist((prev) => ({
                              ...prev,
                              email: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentEmailReceptionist"
                          className="text-xs font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          Email
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentSMSReceptionist"
                          checked={communicationConsentsReceptionist.sms}
                          onCheckedChange={(checked) =>
                            setCommunicationConsentsReceptionist((prev) => ({
                              ...prev,
                              sms: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentSMSReceptionist"
                          className="text-xs font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          SMS
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentPhoneCallReceptionist"
                          checked={communicationConsentsReceptionist.phoneCall}
                          onCheckedChange={(checked) =>
                            setCommunicationConsentsReceptionist((prev) => ({
                              ...prev,
                              phoneCall: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentPhoneCallReceptionist"
                          className="text-xs font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          Phone Call
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Consents stored for compliance purposes.
                    </p>
                  </div>
                </div>
              </div>
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
                setCommunicationConsentsReceptionist({
                  whatsapp: false,
                  email: false,
                  sms: false,
                  phoneCall: false,
                });
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

      {/* Lab Checkout Dialog */}
      <Dialog open={labCheckoutDialog} onOpenChange={setLabCheckoutDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="rounded-full bg-purple-100 p-1.5 text-purple-600">
                🔬
              </span>
              Lab Test Checkout
            </DialogTitle>
            <DialogDescription>
              Complete the lab test appointment and send the report to the patient
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Patient Info */}
            <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-2">
              <p className="font-semibold text-purple-900">
                {selectedLabAppointment?.patientName}
              </p>
              <p className="text-sm text-purple-700">
                {selectedLabAppointment?.reason || "Lab Test"}
              </p>
              <p className="text-xs text-purple-600">
                Scheduled: {selectedLabAppointment?.time 
                  ? formatAppointmentTime(selectedLabAppointment?.date, selectedLabAppointment?.time)
                  : "—"}
              </p>
            </div>

            {/* MediEase Email Section */}
            <div className="rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/80 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <p className="font-semibold text-purple-800">
                  Send Lab Report To:
                </p>
              </div>
              
              {isLoadingLabPatient ? (
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading patient email...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-purple-200">
                    <span className="text-purple-500 font-mono text-sm break-all">
                      {labPatientEmail || "No email available"}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    This is the patient's MediEase clinic email. Please send the lab report to this email address.
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircleIcon className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-sm">Important</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs">
                After clicking "Complete Checkout", please email the lab report to the patient's MediEase email shown above.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLabCheckoutDialog(false);
                setSelectedLabAppointment(null);
                setLabPatientEmail("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLabCheckout}
              disabled={isProcessingLabCheckout || !labPatientEmail}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessingLabCheckout ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Complete Checkout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vitals Dialog */}
      <Dialog open={vitalsDialog} onOpenChange={setVitalsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 p-1.5 text-blue-600">
                <ActivityIcon className="h-5 w-5" />
              </span>
              Add Patient Vitals
            </DialogTitle>
            <DialogDescription>
              Record vital signs for {selectedAppointmentForVitals?.patientName || "patient"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Primary Vitals */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Primary Vitals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blood-pressure">Blood Pressure</Label>
                  <Input
                    id="blood-pressure"
                    placeholder="e.g., 120/80"
                    value={vitalsForm.bloodPressure}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heart-rate">Heart Rate (bpm)</Label>
                  <Input
                    id="heart-rate"
                    placeholder="e.g., 72"
                    type="number"
                    value={vitalsForm.heartRate}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, heartRate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°F)</Label>
                  <Input
                    id="temperature"
                    placeholder="e.g., 98.6"
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperature}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, temperature: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    placeholder="e.g., 150"
                    type="number"
                    step="0.1"
                    value={vitalsForm.weight}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, weight: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Additional Vitals */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Additional Vitals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blood-glucose">Blood Glucose (mg/dL)</Label>
                  <Input
                    id="blood-glucose"
                    placeholder="e.g., 100"
                    type="number"
                    value={vitalsForm.bloodGlucose}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, bloodGlucose: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oxygen-saturation">Oxygen Saturation (%)</Label>
                  <Input
                    id="oxygen-saturation"
                    placeholder="e.g., 98"
                    type="number"
                    min="0"
                    max="100"
                    value={vitalsForm.oxygenSaturation}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="respiratory-rate">Respiratory Rate (per min)</Label>
                  <Input
                    id="respiratory-rate"
                    placeholder="e.g., 16"
                    type="number"
                    value={vitalsForm.respiratoryRate}
                    onChange={(e) =>
                      setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="vitals-notes">Notes (Optional)</Label>
              <Textarea
                id="vitals-notes"
                placeholder="Add any additional notes about the vitals..."
                rows={3}
                value={vitalsForm.notes}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setVitalsDialog(false);
                setSelectedAppointmentForVitals(null);
                setVitalsForm({
                  bloodPressure: "",
                  heartRate: "",
                  temperature: "",
                  weight: "",
                  bloodGlucose: "",
                  oxygenSaturation: "",
                  respiratoryRate: "",
                  notes: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVitals}
              disabled={isSavingVitals}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSavingVitals ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Save Vitals
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
