import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircleIcon,
  UserPlusIcon,
  ClockIcon,
  FileTextIcon,
  SearchIcon,
  Loader2Icon,
  UploadIcon,
  CalendarIcon,
  FilterIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { get, post, patch } from "@/lib/api-client";
import { todayLocalYYYYMMDD } from "@/lib/date";
import { toast } from "@/components/ui/use-toast";
import { useQueueWebSocket } from "@/hooks/use-websocket";
import { NewAppointmentDialog } from "@/polymet/components/new-appointment-dialog";

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  age?: string;
  gender?: string;
  phone?: string;
  email?: string;
  presentInClinic?: boolean;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

interface QueueEntry {
  _id: string;
  queue_id: string;
  patient: Patient;
  doctor: Doctor;
  appointment?: {
    _id: string;
    appointmentId: string;
  };
  checked_in_at: string;
  status: "waiting" | "in-consultation" | "completed" | "checkout";
  queue_number: number;
  priority: string;
  reason: string;
  notes: string;
  wait_time: number;
}

interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: "scheduled" | "cancelled" | "checked-in" | "ongoing" | "checkout" | "completed";
  reason: string;
}

const extractList = <T,>(rawData: any): T[] => {
  if (Array.isArray(rawData)) return rawData as T[];
  if (rawData?.data && Array.isArray(rawData.data)) return rawData.data as T[];
  if (rawData?.appointments && Array.isArray(rawData.appointments)) return rawData.appointments as T[];
  if (rawData?.queue && Array.isArray(rawData.queue)) return rawData.queue as T[];
  return [];
};

export function ReceptionistWorkstation() {
  const navigate = useNavigate();
const [, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket for real-time queue updates
  const { lastMessage, isConnected } = useQueueWebSocket();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"appointment" | "patient">("appointment");

  // Dialog states
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [scheduleAppointmentDialog, setScheduleAppointmentDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);

  // Check-in state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [checkInReason, setCheckInReason] = useState("");
  const [checkInPriority, setCheckInPriority] = useState("medium");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Register patient state
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
  const [createAppointmentOnRegister, setCreateAppointmentOnRegister] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDoctorId, setAppointmentDoctorId] = useState("");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Schedule appointment state
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<Patient | null>(null);

  // Checkout state
  const [selectedQueueEntry, setSelectedQueueEntry] = useState<QueueEntry | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showNoPrescriptionConfirm, setShowNoPrescriptionConfirm] = useState(false);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await cleanupOldAppointments();

      const today = todayLocalYYYYMMDD();
      await Promise.all([
        fetchPatients(),
        fetchDoctors(),
        fetchQueue(),
        fetchAppointments(today),
      ]);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cleanupOldAppointments]);

  const fetchDataSilently = useCallback(async () => {
    try {
      await cleanupOldAppointments();

      const today = todayLocalYYYYMMDD();
      await Promise.all([
        fetchPatients(),
        fetchDoctors(),
        fetchQueue(),
        fetchAppointments(today),
      ]);
    } catch (err) {
      console.error("Failed to fetch data silently:", err);
    }
  }, [cleanupOldAppointments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!checkoutDialog) {
      setPrescriptionFile(null);
      setShowNoPrescriptionConfirm(false);
    }
  }, [checkoutDialog]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    const handleQueueUpdate = async () => {
      try {
        if (lastMessage.type === 'patient_checked_in' ||
            lastMessage.type === 'patient_status_updated' ||
            lastMessage.type === 'queue_reordered') {
          // Refresh data silently (no loading state)
          await fetchDataSilently();
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    handleQueueUpdate();
  }, [lastMessage]);

  const fetchPatients = async () => {
    try {
      const response = await get<Patient[]>("/api/patients?limit=100");
      if (response.success && Array.isArray(response.data)) {
        setPatients(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await get<Doctor[]>("/api/doctors?limit=100");
      if (response.success) {
        const doctorsData = extractList<Doctor>(response.data);
        setDoctors(doctorsData.map(d => ({
          ...d,
          fullName: `${d.firstName} ${d.lastName}`,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await get<{ queue: QueueEntry[] }>("/api/queue");
      if (response.success && response.data?.queue) {
        setQueueEntries(response.data.queue);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  };

  const fetchAppointments = async (date: string) => {
    try {
      const response = await get<Appointment[]>(`/api/appointments?date=${date}&status=scheduled&limit=100`);
      if (response.success) {
        const appts = extractList<Appointment>(response.data);
        setAppointments(appts);
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    }
  };

  // Filter appointments and patients based on search
  const filteredAppointments = appointments.filter((apt) => {
    if (searchFilter !== "appointment") return false;
    if (!searchQuery) return apt.status === "scheduled";
    const query = searchQuery.toLowerCase();
    return (
      apt.status === "scheduled" &&
      (apt.patientName.toLowerCase().includes(query) ||
       apt.appointmentId.toLowerCase().includes(query) ||
       apt.doctorName.toLowerCase().includes(query) ||
       apt.reason.toLowerCase().includes(query))
    );
  });

  // Get patients without appointments today

  // Get queue entries by status
  const checkedInPatients = queueEntries.filter((entry) => entry.status === "waiting");
  const ongoingPatients = queueEntries.filter((entry) => entry.status === "in-consultation");
  const checkoutPatients = queueEntries.filter((entry) => entry.status === "checkout" || entry.status === "completed");

  // Handle check-in (via appointment)
  const handleCheckIn = async () => {
    if (!selectedAppointmentId) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCheckingIn(true);
      const response = await post("/api/queue/check-in", {
        appointmentId: selectedAppointmentId,
        reason: checkInReason || "General Consultation",
        priority: checkInPriority,
        notes: "",
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment checked in successfully",
        });
        setCheckInDialog(false);
        setSelectedAppointmentId("");
        setCheckInReason("");
        setCheckInPriority("medium");
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to check in appointment",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to check in appointment",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

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

  // Handle register patient
  const handleRegisterPatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRegistering(true);
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

      const patientData = {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        gender: newPatient.gender || "Other",
        dateOfBirth: newPatient.dateOfBirth || undefined,
        age: newPatient.dateOfBirth ? calculateAge(newPatient.dateOfBirth) : undefined,
        phone: `+91 ${newPatient.phone.replace(/\s/g, '')}`.trim(),
        email: newPatient.email || `${newPatient.firstName.toLowerCase()}.${newPatient.lastName.toLowerCase()}@example.com`,
        address: newPatient.address || "",
        bloodGroup: newPatient.bloodGroup || "A+",
        agreedToDataStorage: true, // Patient has agreed via checkbox
      };

      const response = await post("/api/patients", patientData);
      if (response.success) {
        const patientId = (response.data as any)?.patient?._id;
        
        // Create appointment if requested
        if (createAppointmentOnRegister && patientId && appointmentDoctorId && appointmentDate && appointmentTime) {
          try {
            const appointmentResponse = await post("/api/appointments", {
              patientId: patientId,
              doctorId: appointmentDoctorId,
              date: appointmentDate,
              time: appointmentTime,
              duration: 30,
              reason: appointmentReason || "General Consultation",
              priority: "medium",
            });
            
            if (appointmentResponse.success) {
              toast({
                title: "Success",
                description: "Patient registered and appointment scheduled",
              });
            } else {
              toast({
                title: "Partial Success",
                description: "Patient registered but appointment creation failed",
                variant: "destructive",
              });
            }
          } catch (err) {
            toast({
              title: "Partial Success",
              description: "Patient registered but appointment creation failed",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Patient registered successfully",
          });
        }

        setRegisterDialog(false);
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
        setCreateAppointmentOnRegister(false);
        setAppointmentDate("");
        setAppointmentTime("");
        setAppointmentDoctorId("");
        setAppointmentReason("");
        await fetchData();
        navigate("/receptionist-patients");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to register patient",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to register patient",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };


  // Handle complete checkout
  const handleCompleteCheckout = async (skipPrescriptionWarning = false) => {
    if (!selectedQueueEntry) return;

    if (!prescriptionFile && !skipPrescriptionWarning) {
      setShowNoPrescriptionConfirm(true);
      return;
    }

    try {
      setIsCheckingOut(true);

      // Upload prescription if provided
      if (prescriptionFile) {
        const formData = new FormData();
        formData.append("file", prescriptionFile);
        if (selectedQueueEntry.reason) {
          formData.append("notes", selectedQueueEntry.reason);
        }

        if (selectedQueueEntry.appointment?._id) {
          await post(`/api/appointments/${selectedQueueEntry.appointment._id}/prescription-upload`, formData);
        } else {
          toast({
            title: "Prescription not attached",
            description: "Could not find an appointment to associate the uploaded prescription. Checkout will proceed without attaching the file.",
            variant: "destructive",
          });
        }
      }

      // Update appointment status to completed
      if (selectedQueueEntry.appointment?._id) {
        await patch(`/api/appointments/${selectedQueueEntry.appointment._id}/status`, {
          status: "completed",
        });
      }

      // Remove from queue
      if (selectedQueueEntry._id) {
        await post(`/api/queue/${selectedQueueEntry._id}/check-out`, {});
      }

      // Update queue entry status to checked-out to remove from active queue
      await patch(`/api/queue/${selectedQueueEntry._id}/status`, {
        status: "checked-out",
      });

      toast({
        title: "Success",
        description: "Checkout completed successfully",
      });
      setCheckoutDialog(false);
      setSelectedQueueEntry(null);
      setPrescriptionFile(null);
      setQueueEntries((prev) => prev.filter((entry) => entry._id !== selectedQueueEntry._id));
      await fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to complete checkout",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar with Filter and Action Buttons */}
      <div className="flex items-center gap-4">
        <Card className="flex-1 border-2 border-teal-200 dark:border-teal-800 shadow-lg bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1 bg-white dark:bg-gray-900 rounded-lg border-2 border-teal-300 dark:border-teal-700 px-4 py-2.5 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200 dark:focus-within:ring-teal-800 transition-all">
                <SearchIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <Input
                  placeholder={`Search ${searchFilter === "appointment" ? "appointments" : "patients"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                />
              </div>
              <Select value={searchFilter} onValueChange={(value: "appointment" | "patient") => setSearchFilter(value)}>
                <SelectTrigger className="w-[200px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white border-0 shadow-md font-medium">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-teal-600" />
                      Appointments
                    </span>
                  </SelectItem>
                  <SelectItem value="patient">
                    <span className="flex items-center gap-2">
                      <UserPlusIcon className="h-4 w-4 text-emerald-600" />
                      Patients
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-4">
          {/* WebSocket connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button
            onClick={() => setRegisterDialog(true)}
            size="lg"
            className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700 text-white shadow-xl font-bold px-8 py-6 h-auto whitespace-nowrap text-base border-2 border-teal-500/20 hover:border-teal-400/40 transition-all duration-200 hover:scale-105"
          >
            <UserPlusIcon className="h-5 w-5 mr-2.5" />
            Register Patient
          </Button>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in Column */}
        <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <CheckCircleIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Check-in
              </span>
              <Badge className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-0 shadow-sm">
                {checkedInPatients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="min-h-[600px] rounded-lg border-2 border-dashed border-teal-400 dark:border-teal-600 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/30 dark:to-emerald-950/30 p-4 space-y-2">
              {checkedInPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 opacity-30 text-teal-400" />
                  <p>No checked-in patients</p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Use the search bar above to find appointments and check them in
                  </p>
                </div>
              ) : (
                checkedInPatients.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-lg border-2 border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-900 hover:border-teal-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 border-2 border-teal-400 dark:border-teal-600">
                        <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-semibold">
                          {entry.patient?.firstName?.[0] || entry.patient?.fullName?.[0] || 'P'}{entry.patient?.lastName?.[0] || entry.patient?.fullName?.[1] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{entry.patient?.fullName || `${entry.patient?.firstName || ''} ${entry.patient?.lastName || ''}`.trim() || 'Unknown Patient'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dr. {entry.doctor?.firstName || ''} {entry.doctor?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {entry.reason}
                        </p>
                        <Badge className="mt-2 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-0">
                          Queue #{entry.queue_number}
                        </Badge>
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-semibold flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          Waiting for doctor to start consultation
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consultation Column */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Consultation
              </span>
              <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-sm">
                {ongoingPatients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="min-h-[600px] rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 p-4 space-y-2">
              {ongoingPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-30 text-blue-400" />
                  <p>No ongoing consultations</p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Patients appear here when doctor starts consultation
                  </p>
                </div>
              ) : (
                ongoingPatients.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 border-2 border-blue-400 dark:border-blue-600">
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                          {entry.patient?.firstName?.[0] || entry.patient?.fullName?.[0] || 'P'}{entry.patient?.lastName?.[0] || entry.patient?.fullName?.[1] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{entry.patient?.fullName || `${entry.patient?.firstName || ''} ${entry.patient?.lastName || ''}`.trim() || 'Unknown Patient'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dr. {entry.doctor?.firstName || ''} {entry.doctor?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {entry.reason}
                        </p>
                        <Badge className="mt-2 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
                          Queue #{entry.queue_number}
                        </Badge>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-semibold flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          Consultation in progress...
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checkout Column */}
        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <FileTextIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Checkout
              </span>
              <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 shadow-sm">
                {checkoutPatients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="min-h-[600px] rounded-lg border-2 border-dashed border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 space-y-2">
              {checkoutPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileTextIcon className="h-12 w-12 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p>No patients in checkout</p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Patients appear here when doctor ends consultation
                  </p>
                </div>
              ) : (
                checkoutPatients.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 hover:border-amber-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 border-2 border-amber-400 dark:border-amber-600">
                        <AvatarFallback className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold">
                          {entry.patient?.firstName?.[0] || entry.patient?.fullName?.[0] || 'P'}{entry.patient?.lastName?.[0] || entry.patient?.fullName?.[1] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{entry.patient?.fullName || `${entry.patient?.firstName || ''} ${entry.patient?.lastName || ''}`.trim() || 'Unknown Patient'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dr. {entry.doctor?.firstName || ''} {entry.doctor?.lastName || ''}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                          <FileTextIcon className="h-3 w-3" />
                          Ready for prescription upload
                        </p>
                        <Button
                          size="sm"
                          className="mt-2 w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md font-medium"
                          onClick={() => {
                            setSelectedQueueEntry(entry);
                            setCheckoutDialog(true);
                          }}
                        >
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Upload Prescription
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Dialog (Appointment-based) */}
      <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Appointment</DialogTitle>
            <DialogDescription>
              Check in the selected appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Appointment</Label>
              <Select
                value={selectedAppointmentId}
                onValueChange={setSelectedAppointmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an appointment" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAppointments.map((apt) => (
                    <SelectItem key={apt._id} value={apt._id}>
                      {apt.patientName} - {apt.appointmentId} ({apt.time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={checkInReason}
                onChange={(e) => setCheckInReason(e.target.value)}
                placeholder="General Consultation"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
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
            <Button variant="outline" onClick={() => setCheckInDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !selectedAppointmentId}
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

      {/* Register Patient Dialog */}
      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>
              Register a new patient. Optionally create an appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newPatient.firstName}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, firstName: e.target.value })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={newPatient.lastName}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, lastName: e.target.value })
                  }
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md bg-muted">
                    +91
                  </span>
                  <Input
                    value={newPatient.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={11}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={newPatient.email}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, email: e.target.value })
                  }
                  placeholder="patient@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(value) =>
                    setNewPatient({ ...newPatient, gender: value })
                  }
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
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Input
                  value={newPatient.address}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* Appointment Creation Option */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createAppointment"
                  checked={createAppointmentOnRegister}
                  onChange={(e) => setCreateAppointmentOnRegister(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="createAppointment">Create appointment now</Label>
              </div>
              {createAppointmentOnRegister && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Doctor *</Label>
                    <Select
                      value={appointmentDoctorId}
                      onValueChange={setAppointmentDoctorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor._id} value={doctor._id}>
                            Dr. {doctor.firstName} {doctor.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={todayLocalYYYYMMDD()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input
                      value={appointmentReason}
                      onChange={(e) => setAppointmentReason(e.target.value)}
                      placeholder="General Consultation"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRegisterPatient}
              disabled={isRegistering}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isRegistering ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Register {createAppointmentOnRegister ? "& Schedule" : ""}
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
            setSelectedPatientForAppointment(null);
          }
        }}
        initialPatientId={selectedPatientForAppointment?._id || ""}
        onAppointmentUpdated={() => {
          // Refresh data if needed
          fetchData();
        }}
      />

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout Patient</DialogTitle>
            <DialogDescription>
              Upload prescription and complete checkout
            </DialogDescription>
          </DialogHeader>
          {selectedQueueEntry && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedQueueEntry.patient.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedQueueEntry.patient.patientId}
                </p>
              </div>
              <Alert className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircleIcon className="h-5 w-5" />
                <AlertTitle>Upload the prescription if possible</AlertTitle>
                <AlertDescription>
                  Keeping a copy of the prescription ensures better continuity of care. You can still complete checkout without a file, but please try to attach it when available.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Prescription File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setPrescriptionFile(e.target.files?.[0] || null)
                    }
                    className="flex-1"
                    disabled={isCheckingOut}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog(false)}>
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
    </div>
  );
}

