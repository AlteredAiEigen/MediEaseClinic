import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRightIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  ActivityIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
  GripVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2Icon,
} from "lucide-react";
import { get, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { ConsultationHistoryDialog } from "@/polymet/components/consultation-history-dialog";

interface QueuePatient {
  id: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  appointmentTime: string;
  reason: string;
  priority: "low" | "normal" | "high" | "emergency";
  waitTime: string;
  avatar: string;
  patientId: string;
  status: string;
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
    email?: string;
  };
  appointment?: {
    _id: string;
    appointmentId?: string;
  } | string;
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

interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: string;
  status: string;
  reason?: string;
  patientName?: string;
  doctorName?: string;
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
  if (rawData && Array.isArray(rawData.appointments)) {
    return rawData.appointments as T[];
  }
  return [];
};

export function DoctorWorkstation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConsultationHistory, setShowConsultationHistory] = useState(false);

  // Fetch queue data and today's appointments
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch queue first
        const queueResponse = await get<{ queue: QueueEntry[] }>(`/api/queue/doctor/${user._id}`);
        let mappedQueue: QueuePatient[] = [];
        const queuePatientIds = new Set<string>();
        const queueAppointmentIds = new Set<string>();
        
        if (queueResponse.success && queueResponse.data?.queue) {
          mappedQueue = queueResponse.data.queue
            .filter((entry) => entry.status === "waiting" || entry.status === "in-consultation")
            .map((entry) => {
              const patientId = entry.patient._id || entry.patient.patientId;
              queuePatientIds.add(patientId);
              
              // Collect appointment ID from queue entry (normalize to string)
              if (entry.appointment) {
                let aptId = "";
                if (typeof entry.appointment === "string") {
                  aptId = entry.appointment;
                } else if (entry.appointment._id) {
                  aptId = String(entry.appointment._id);
                } else if (entry.appointment.appointmentId) {
                  aptId = String(entry.appointment.appointmentId);
                }
                if (aptId) {
                  queueAppointmentIds.add(aptId);
                }
              }
              
              return {
                id: entry._id,
                name: entry.patient.fullName,
                age: entry.patient.age || "N/A",
                gender: entry.patient.gender || "N/A",
                phone: entry.patient.phone || "N/A",
                email: entry.patient.email || "N/A",
                appointmentTime: new Date(entry.checked_in_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                reason: entry.reason || "Consultation",
                priority: (entry.priority as "low" | "normal" | "high" | "emergency") || "normal",
                waitTime: `${entry.wait_time} min`,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.patient.fullName)}&background=random`,
                patientId: patientId,
                status: entry.status,
              };
            });
          setQueuePatients(mappedQueue);
        }

        // Fetch today's appointments
        const today = new Date().toISOString().split("T")[0];
        const appointmentsResponse = await get(`/api/appointments?date=${today}&limit=100`);
        
        if (appointmentsResponse.success) {
          const appointmentsList = extractList<Appointment>(appointmentsResponse.data);
          
          // Normalize date for comparison
          const normalizeDate = (dateStr: string | undefined): string => {
            if (!dateStr) return "";
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return dateStr;
            }
            if (dateStr.includes("T")) {
              return dateStr.split("T")[0];
            }
            return dateStr;
          };
          
          // Filter for scheduled appointments for today that are NOT checked-in and NOT in queue
          const todayAppointments = appointmentsList.filter(
            (apt) => {
              const aptDate = normalizeDate(apt.date);
              const status = (apt.status || "").toLowerCase();
              const patientId = String(apt.patientId || "");
              // Normalize appointment ID - try both _id and appointmentId
              const appointmentId = String(apt._id || apt.appointmentId || "");
              
              // Exclude if:
              // 1. Not today's date
              // 2. Status is not "scheduled" (e.g., checked-in, completed, cancelled, in-progress)
              // 3. Appointment is already in the queue (by appointment ID - primary check)
              // 4. Patient is already in the queue (by patient ID - fallback check)
              const isToday = aptDate === today;
              const isScheduled = status === "scheduled";
              const notInQueueByAppointmentId = !queueAppointmentIds.has(appointmentId);
              const notInQueueByPatientId = !queuePatientIds.has(patientId);
              const notCheckedIn = status !== "checked-in" && status !== "in-progress";
              
              // Only show if all conditions are met
              return (
                isToday &&
                isScheduled &&
                notCheckedIn &&
                notInQueueByAppointmentId &&
                notInQueueByPatientId
              );
            }
          );
          
          setScheduledAppointments(todayAppointments);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Auto-advance to next patient when returning from consultation
  const checkConsultationCompletion = async () => {
    const consultationCompleted = sessionStorage.getItem(
      "consultationCompleted"
    );
    if (consultationCompleted === "true") {
      // Prevent multiple simultaneous checks
      sessionStorage.setItem("consultationCompleted", "processing");

      // Refresh queue data to get updated patient list
      if (user?._id) {
        try {
          // Fetch updated queue data
          const queueResponse = await get<{ queue: QueueEntry[] }>(`/api/queue/doctor/${user._id}`);
          let mappedQueue: QueuePatient[] = [];
          const queuePatientIds = new Set<string>();
          const queueAppointmentIds = new Set<string>();

          if (queueResponse.success && queueResponse.data?.queue) {
            mappedQueue = queueResponse.data.queue
              .filter((entry) => entry.status === "waiting" || entry.status === "in-consultation")
              .map((entry) => {
                const patientId = entry.patient._id || entry.patient.patientId;
                queuePatientIds.add(patientId);

                // Collect appointment ID from queue entry (normalize to string)
                if (entry.appointment) {
                  let aptId = "";
                  if (typeof entry.appointment === "string") {
                    aptId = entry.appointment;
                  } else if (entry.appointment._id) {
                    aptId = String(entry.appointment._id);
                  } else if (entry.appointment.appointmentId) {
                    aptId = String(entry.appointment.appointmentId);
                  }
                  if (aptId) {
                    queueAppointmentIds.add(aptId);
                  }
                }

                return {
                  id: entry._id,
                  name: entry.patient.fullName,
                  age: entry.patient.age || "N/A",
                  gender: entry.patient.gender || "N/A",
                  phone: entry.patient.phone || "N/A",
                  email: entry.patient.email || "N/A",
                  appointmentTime: new Date(entry.checked_in_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  reason: entry.reason || "Consultation",
                  priority: (entry.priority as "low" | "normal" | "high" | "emergency") || "normal",
                  waitTime: `${entry.wait_time} min`,
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.patient.fullName)}&background=random`,
                  patientId: patientId,
                  status: entry.status,
                };
              });
            setQueuePatients(mappedQueue);
          }

          // Adjust current index if needed
          setCurrentIndex((prevIndex) => {
            if (mappedQueue.length === 0) {
              return 0; // No patients left
            }
            if (prevIndex >= mappedQueue.length) {
              return Math.max(0, mappedQueue.length - 1); // Adjust if index is out of bounds
            }
            return prevIndex; // Keep current index if still valid
          });

        } catch (err) {
          console.error("Failed to refresh queue after consultation:", err);
        }
      }

      // Clear the processing flag
      sessionStorage.removeItem("consultationCompleted");
    } else if (consultationCompleted === "processing") {
      // Already being processed, skip
      return;
    }
  };

  useEffect(() => {
    // Check on mount
    checkConsultationCompletion();

    // Check when window regains focus (user returns from consultation)
    const handleWindowFocus = async () => {
      await checkConsultationCompletion();
    };

    // Check when page becomes visible (handles tab switching)
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        await checkConsultationCompletion();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also check periodically every 2 seconds in case other events miss it
    const interval = setInterval(async () => {
      await checkConsultationCompletion();
    }, 2000);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []); // Run only once on mount

  const handleNext = () => {
    if (currentIndex < queuePatients.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleStartConsultation = async () => {
    const currentPatient = queuePatients[currentIndex];
    if (!currentPatient) return;

    try {
      // Call start-consultation API to update queue status to "in-consultation"
      const response = await put(`/api/queue/${currentPatient.id}/start-consultation`, {});
      
      if (response.success) {
        // Update local state to reflect the status change
        setQueuePatients((prev) =>
          prev.map((p, index) =>
            index === currentIndex ? { ...p, status: "in-consultation" } : p
          )
        );
        
        // Navigate to consultation page
        navigate(`/consultation/${currentPatient.patientId}?queueId=${currentPatient.id}`);
      } else {
        console.error("Failed to start consultation:", response.message);
        alert(response.message || "Failed to start consultation. Please try again.");
      }
    } catch (err) {
      console.error("Failed to start consultation:", err);
      alert("Failed to start consultation. Please try again.");
    }
  };

  const handleComplete = async () => {
    const currentPatient = queuePatients[currentIndex];
    if (!currentPatient) return;

    try {
      // Mark consultation as completed
      const response = await put(`/api/queue/${currentPatient.id}/status`, {
        status: "completed",
      });

      if (response.success) {
        // Remove current patient and automatically move to next
        setQueuePatients((prev) => {
          const newQueue = prev.filter((_, index) => index !== currentIndex);
          // If there are more patients, current index stays the same (next patient moves up)
          // If this was the last patient, index will be reduced automatically
          return newQueue;
        });
      }
    } catch (err) {
      console.error("Failed to complete consultation:", err);
    }

    // Don't change currentIndex - the next patient will automatically become current
    // Only adjust if we're beyond the new array length
    if (currentIndex >= queuePatients.length - 1 && currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const currentPatient = queuePatients[currentIndex];

  // Show scheduled appointments if no queue patients
  if (!currentPatient && queuePatients.length === 0) {
    if (scheduledAppointments.length > 0) {
      return (
        <>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Today's Scheduled Appointments
                </h2>
                <p className="text-muted-foreground">
                  {scheduledAppointments.length} appointment{scheduledAppointments.length !== 1 ? 's' : ''} scheduled for today
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConsultationHistory(true)}
                  className="gap-2"
                >
                  <FileTextIcon className="w-4 h-4" />
                  Consultation History
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {scheduledAppointments.map((apt) => (
                <Card key={apt._id || apt.appointmentId} className="border-border shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-lg font-bold">
                            {(apt.patientName || "Unknown")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {apt.patientName || "Unknown Patient"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {apt.time || "Time TBD"} • {apt.type || apt.reason || "Consultation"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        Scheduled
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Patient will appear here once they check in at the reception.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <ConsultationHistoryDialog
            open={showConsultationHistory}
            onOpenChange={setShowConsultationHistory}
            doctorId={user?._id}
          />
        </>
      );
    }

    // No queue patients and no scheduled appointments
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Patients in Queue</h2>
              <p className="text-muted-foreground">All consultations are complete!</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowConsultationHistory(true)}
              className="gap-2 mx-auto"
            >
              <FileTextIcon className="w-4 h-4" />
              Consultation History
            </Button>
          </div>
        </div>

        <ConsultationHistoryDialog
          open={showConsultationHistory}
          onOpenChange={setShowConsultationHistory}
          doctorId={user?._id}
        />
      </>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "normal":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "low":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Queue</h2>
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Queue</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // This check is now handled in the early return above
  // Keeping this for safety but it should not be reached
  if (queuePatients.length === 0 && scheduledAppointments.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Patients in Queue</h2>
              <p className="text-muted-foreground">All consultations are complete!</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowConsultationHistory(true)}
              className="gap-2 mx-auto"
            >
              <FileTextIcon className="w-4 h-4" />
              Consultation History
            </Button>
          </div>
        </div>

        <ConsultationHistoryDialog
          open={showConsultationHistory}
          onOpenChange={setShowConsultationHistory}
          doctorId={user?._id}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Patient Queue
          </h2>
          <p className="text-muted-foreground">
            {queuePatients.length} patients waiting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowConsultationHistory(true)}
            className="gap-2"
          >
            <FileTextIcon className="w-4 h-4" />
            Consultation History
          </Button>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <ClockIcon className="w-4 h-4 mr-2" />

            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        </div>
      </div>

      {/* Current Patient Card - Prominent Display */}
      <div className="relative flex items-center justify-center">
        {/* Current Patient Card */}
        <div className="w-full max-w-4xl">
          {currentPatient && (
            <div
              key={currentPatient.id}
              className="w-full transition-all duration-500 ease-out"
            >
              <Card className="border-2 shadow-2xl border-blue-500 dark:border-blue-400">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                        <AvatarImage
                          src={currentPatient.avatar}
                          alt={currentPatient.name}
                        />

                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-xl font-bold">
                          {currentPatient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">
                          {currentPatient.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentPatient.id} • {currentPatient.appointmentTime}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={getPriorityColor(
                              currentPatient.priority
                            )}
                          >
                            {currentPatient.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            <ClockIcon className="w-3 h-3 mr-1" />

                            {currentPatient.waitTime}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                    >
                      Current Patient
                    </Badge>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-500" />
                        Patient Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-muted-foreground" />

                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">
                            {currentPatient.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MailIcon className="w-4 h-4 text-muted-foreground" />

                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">
                            {currentPatient.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ActivityIcon className="w-4 h-4 text-muted-foreground" />

                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline">
                            {currentPatient.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-emerald-500" />
                        Appointment Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Reason for Visit:
                          </span>
                          <p className="font-medium">{currentPatient.reason}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Last Visit:
                          </span>
                          <p className="font-medium">
                            {currentPatient.lastVisit || "First Visit"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        asChild
                      >
                        <Link to={`/patient-overview/${currentPatient.patientId}`}>
                          <FileTextIcon className="w-4 h-4 mr-2" />
                          View History
                        </Link>
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg text-base px-6 py-6"
                        onClick={handleStartConsultation}
                      >
                        <ActivityIcon className="w-5 h-5 mr-2" />
                        Start Consultation
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={handleComplete}
                        className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                      {currentIndex < queuePatients.length - 1 && (
                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
                        >
                          Next Patient
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Patients Queue - Reorderable */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Upcoming Patients</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {queuePatients.length - currentIndex - 1} patients in queue •
                Drag to reorder priority
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queuePatients.slice(currentIndex + 1).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming patients in queue</p>
              </div>
            ) : (
              queuePatients.slice(currentIndex + 1).map((patient, idx) => {
                const actualIndex = currentIndex + 1 + idx;
                return (
                  <div
                    key={patient.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "patientIndex",
                        actualIndex.toString()
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedIndex = parseInt(
                        e.dataTransfer.getData("patientIndex")
                      );
                      if (draggedIndex !== actualIndex) {
                        const newQueue = [...queuePatients];
                        const [draggedPatient] = newQueue.splice(
                          draggedIndex,
                          1
                        );
                        newQueue.splice(actualIndex, 0, draggedPatient);
                        setQueuePatients(newQueue);
                      }
                    }}
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card hover:bg-accent/50 transition-all cursor-move group"
                  >
                    <div className="flex items-center gap-2">
                      <GripVerticalIcon className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            if (actualIndex > currentIndex + 1) {
                              const newQueue = [...queuePatients];
                              [
                                newQueue[actualIndex],
                                newQueue[actualIndex - 1],
                              ] = [
                                newQueue[actualIndex - 1],
                                newQueue[actualIndex],
                              ];

                              setQueuePatients(newQueue);
                            }
                          }}
                          disabled={actualIndex === currentIndex + 1}
                        >
                          <ArrowUpIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            if (actualIndex < queuePatients.length - 1) {
                              const newQueue = [...queuePatients];
                              [
                                newQueue[actualIndex],
                                newQueue[actualIndex + 1],
                              ] = [
                                newQueue[actualIndex + 1],
                                newQueue[actualIndex],
                              ];

                              setQueuePatients(newQueue);
                            }
                          }}
                          disabled={actualIndex === queuePatients.length - 1}
                        >
                          <ArrowDownIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={patient.avatar} alt={patient.name} />

                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.appointmentTime} • {patient.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(patient.priority)}>
                        {patient.priority}
                      </Badge>
                      <Badge variant="outline">
                        <ClockIcon className="w-3 h-3 mr-1" />

                        {patient.waitTime}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        asChild
                      >
                        <Link to={`/patient-overview/${patient.patientId}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consultation History Dialog */}
      <ConsultationHistoryDialog
        open={showConsultationHistory}
        onOpenChange={setShowConsultationHistory}
        doctorId={user?._id}
      />
    </div>
  );
}
