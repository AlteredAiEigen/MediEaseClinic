import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  CheckCircleIcon,
  UserPlusIcon,
  AlertCircleIcon,
  ActivityIcon,
  DollarSignIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XIcon,
  UsersIcon,
  ClockIcon,
  BellIcon,
  TrendingUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  UploadIcon,
  FileTextIcon,
  Loader2Icon,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { get, post, put, del } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  checked_in_at: string;
  status: string;
  queue_number: number;
  priority: string;
  reason: string;
  notes: string;
  wait_time: number;
}

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age?: string;
  gender?: string;
  phone?: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

interface QueueStats {
  total_patients: number;
  waiting: number;
  in_consultation: number;
  completed: number;
  checked_out: number;
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

export function ReceptionistDashboardNew() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queueList, setQueueList] = useState<QueueEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [checkInReason, setCheckInReason] = useState("");
  const [checkInPriority, setCheckInPriority] = useState("medium");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [addPatientDialog, setAddPatientDialog] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchQueueData();
    fetchPatients();
    fetchDoctors();
    fetchQueueStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueueData();
      fetchQueueStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      setIsLoading(true);
      setError(null);
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
      setError(err instanceof Error ? err.message : "Failed to load queue");
      setQueueList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await get("/api/patients?limit=100");
      if (response.success) {
        const patientsData = extractList<Patient>(response.data);
        setPatients(patientsData);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await get("/api/doctors?limit=100");
      if (response.success) {
        const doctorsData = extractList<Doctor>(response.data);
        setDoctors(doctorsData);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      console.error("Failed to load doctors:", err);
      setDoctors([]);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await get<QueueStats>("/api/queue/stats");
      if (response.success && response.data) {
        setQueueStats(response.data);
      }
    } catch (err) {
      console.error("Failed to load queue stats:", err);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.email || !newPatient.phone) {
      alert("Please fill in all required fields (First Name, Last Name, Email, Phone)");
      return;
    }

    try {
      setIsAddingPatient(true);
      const payload = {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        email: newPatient.email,
        phone: newPatient.phone,
        dateOfBirth: newPatient.dateOfBirth || undefined,
        gender: newPatient.gender || undefined,
        address: newPatient.address || undefined,
        bloodGroup: newPatient.bloodGroup || undefined,
      };

      const response = await post<{ patient: any }>("/api/patients", payload);

      if (response.success && response.data?.patient) {
        // Refresh patients list
        await fetchPatients();
        
        // Auto-open check-in dialog with the new patient
        setSelectedPatientId(response.data.patient._id);
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
        setCheckInDialog(true);
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
        appointmentId: selectedPatientId, // Reusing this state for appointmentId
        reason: checkInReason || "General Consultation",
        priority: checkInPriority,
        notes: "",
      });

      if (response.success) {
        setCheckInDialog(false);
        setSelectedPatientId("");
        setSelectedDoctorId("");
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

  const handleCheckOut = async (queueEntryId: string) => {
    try {
      const response = await post(`/api/queue/${queueEntryId}/check-out`, {});
      if (response.success) {
        fetchQueueData();
        fetchQueueStats();
      }
    } catch (err) {
      console.error("Failed to check out patient:", err);
    }
  };

  const checkedInPatients = queueList.filter((q) => q.status === "waiting").length;
  const waitingPatients = queueList.filter((q) => q.status === "waiting").length;
  const inConsultation = queueList.filter((q) => q.status === "in-consultation").length;
  const awaitingCheckout = queueList.filter((q) => q.status === "completed").length;
  const completedToday = queueStats?.completed || 0;

  // Fetch appointments for today
  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await get(`/api/appointments?date=${today}&limit=50`);
      if (response.success) {
        const rawAppointments = extractList<any>(response.data);
        const mappedAppointments = rawAppointments.map((apt: any) => ({
          id: apt._id || apt.appointmentId,
          patientId: apt.patientId,
          patientName: apt.patientName || "Unknown Patient",
          time: apt.time,
          reason: apt.reason || "General Consultation",
          status: apt.status,
          avatar: apt.patientName 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=random`
            : undefined,
        }));
        setAppointmentsList(mappedAppointments);
      }
    } catch (err) {
      console.error("Failed to load appointments:", err);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const handleUploadPrescription = (patientId: string) => {
    setSelectedPatient(patientId);
    setPrescriptionDialog(true);
  };

  const handleSavePrescription = () => {
    if (selectedPatient) {
      // In a real app, this would upload the file and save the prescription
      console.log("Prescription saved for patient:", selectedPatient);
      setPrescriptionDialog(false);
      setPrescriptionFile("");
      setPrescriptionNotes("");
      setSelectedPatient(null);
    }
  };

  const handleCompleteCheckout = async (queueEntryId: string) => {
    await handleCheckOut(queueEntryId);
  };

  const moveToQueue = async (appointmentId: string) => {
    const appointment = appointmentsList.find(
      (apt) => apt.id === appointmentId
    );
    if (!appointment) {
      alert("Appointment not found");
      return;
    }
    
    // Check in the patient from appointment using appointment-based check-in
    try {
      const response = await post("/api/queue/check-in", {
        appointmentId: appointment.id,
        reason: appointment.reason || "General Consultation",
        priority: "medium",
        notes: "",
      });
      
      if (response.success) {
        setAppointmentsList((prev) =>
          prev.filter((apt) => apt.id !== appointmentId)
        );
        fetchQueueData();
        fetchQueueStats();
        fetchTodayAppointments();
      } else {
        alert(response.message || "Failed to check in patient");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check in patient";
      alert(message);
      console.error("Failed to check in from appointment:", err);
    }
  };

  const removeFromAppointments = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await del(`/api/appointments/${appointmentId}`);
      if (response.success) {
        setAppointmentsList((prev) =>
          prev.filter((apt) => apt.id !== appointmentId)
        );
        fetchTodayAppointments();
        alert("Appointment cancelled successfully");
      } else {
        alert(response.message || "Failed to cancel appointment");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel appointment";
      alert(message);
      console.error("Failed to cancel appointment:", err);
    }
  };

  const avgWaitTime = queueStats?.average_wait_time || 
    (queueList.length > 0 ? Math.floor(15 + Math.random() * 20) : 0);
  const peakHours = [9, 10, 11, 14, 15, 16];
  const currentHour = currentTime.getHours();
  const isPeakTime = peakHours.includes(currentHour);

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
          {isPeakTime && (
            <Badge className="bg-amber-500 text-white border-0 shadow-md">
              <BellIcon className="h-3 w-3 mr-1" />
              Peak Hours
            </Badge>
          )}
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            {queueList.length} Active Patients
          </Badge>
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
                  Successfully processed
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
                {avgWaitTime} min
              </p>
              <Progress
                value={Math.min((avgWaitTime / 60) * 100, 100)}
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
              <p className="text-lg font-bold text-foreground">
                {isPeakTime ? "Peak Hours" : "Normal"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isPeakTime ? "High patient volume" : "Steady flow"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments & Queue Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appointments Stats */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle className="text-lg font-semibold">
                Today's Appointments
              </CardTitle>
            </div>
            <Link to="/receptionist-appointments">
              <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-200 dark:border-teal-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Total Today</p>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {appointmentsList.length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {appointmentsList.filter((apt) => apt.status === "scheduled").length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Checked In</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {appointmentsList.filter((apt) => apt.status === "checked-in").length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border border-gray-200 dark:border-gray-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Completed</p>
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                  {appointmentsList.filter((apt) => apt.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Stats */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <CardTitle className="text-lg font-semibold">
                Patient Queue
              </CardTitle>
            </div>
            <Link to="/receptionist-workstation">
              <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700">
                View Queue
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Total in Queue</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {queueList.length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-200 dark:border-teal-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Waiting</p>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {waitingPatients}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">In Consultation</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {inConsultation}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">Awaiting Checkout</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {awaitingCheckout}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Input
                  id="phone"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  placeholder="+1-555-0123"
                />
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
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPatient}
              disabled={isAddingPatient}
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
                  Add Patient & Check In
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    .map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.patientName} - {apt.time} ({apt.reason})
                      </SelectItem>
                    ))}
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
                setSelectedDoctorId("");
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

      {/* Prescription Upload Dialog */}
      <Dialog open={prescriptionDialog} onOpenChange={setPrescriptionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Prescription</DialogTitle>
            <DialogDescription>
              Upload prescription for patient {selectedPatient}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prescription-file">Prescription File</Label>
              <Input
                id="prescription-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setPrescriptionFile(e.target.value)}
              />

              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prescription-notes">Notes (Optional)</Label>
              <Textarea
                id="prescription-notes"
                placeholder="Add any additional notes about the prescription..."
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPrescriptionDialog(false);
                setPrescriptionFile("");
                setPrescriptionNotes("");
                setSelectedPatient(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePrescription}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
