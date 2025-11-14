import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LabReportsCard } from "@/polymet/components/lab-reports-card";
import { DashboardStatsSection } from "@/polymet/components/dashboard-stats-section";
import { HealthInsightsSection } from "@/polymet/components/health-insights-section";
import { PatientAnalysisSection } from "@/polymet/components/patient-analysis-section";
import { NewAppointmentDialog } from "@/polymet/components/new-appointment-dialog";
import { AddPatientDialog } from "@/polymet/components/add-patient-dialog";
import { WritePrescriptionDialog } from "@/polymet/components/write-prescription-dialog";
import { ViewReportsDialog } from "@/polymet/components/view-reports-dialog";
import { MessagesDialog } from "@/polymet/components/messages-dialog";
import { LabReportViewerDialog } from "@/polymet/components/lab-report-viewer-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarIcon,
  UsersRoundIcon,
  EyeIcon,
  PlayIcon,
  GripVerticalIcon,
  ActivityIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { get, post, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { useDoctorQueueWebSocket } from "@/hooks/use-websocket";

interface QueuePatient {
  id: string;
  patientId: string;
  name: string;
  avatar: string;
  time: string;
  appointmentType: string;
  status: "waiting" | "in-progress";
  queueNumber?: number;
  priority?: string;
  reason?: string;
}

interface UpcomingAppointment {
  id: string;
  name: string;
  avatar: string;
  time: string;
  appointmentType: string;
  patientId?: string;
  doctorId?: string;
  reason?: string;
  priority?: string;
}

interface QueueEntry {
  _id: string;
  queue_id: string;
  patient: {
    _id: string;
    fullName: string;
    patientId: string;
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

export function DoctorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [inQueue, setInQueue] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for real-time queue updates
  const { lastMessage, isConnected } = useDoctorQueueWebSocket(user?._id || "");

  // Dialog states
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<any>(null);

  // Queue patients state - can be moved to upcoming
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);

  // Upcoming appointments state - can receive from queue
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  const [queueActionId, setQueueActionId] = useState<string | null>(null);

  // Fetch queue and appointments data
  const fetchDashboardData = async (showLoading = true) => {
    if (!user?._id) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch doctor's queue
      const queueResponse = await get<{ queue: QueueEntry[] }>(`/api/queue/doctor/${user._id}`);
      if (queueResponse.success && queueResponse.data?.queue) {
        const mappedQueue: QueuePatient[] = queueResponse.data.queue
          .filter((entry) => entry.status === "waiting" || entry.status === "in-consultation")
          .filter((entry) => entry.doctor._id === user._id) // Extra safeguard: ensure patients belong to this doctor
          .map((entry) => ({
            id: entry._id,
            patientId: entry.patient._id,
            name: entry.patient.fullName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.patient.fullName)}&background=random`,
            time: new Date(entry.checked_in_at).toLocaleString("en-US", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
            }),
            appointmentType: entry.reason || "Consultation",
            status: entry.status === "in-consultation" ? "in-progress" : "waiting",
            queueNumber: entry.queue_number,
            priority: entry.priority,
            reason: entry.reason,
          }));
        setQueuePatients(mappedQueue);
        setInQueue(mappedQueue.length);
      }

      // Fetch today's appointments (all statuses for today, doctor auto-filtered by backend)
      const today = new Date().toISOString().split("T")[0];
      const appointmentsResponse = await get(
        `/api/appointments?date=${today}&limit=100`
      );
      
      if (appointmentsResponse.success) {
        // Extract appointments from response using helper
        const appointmentsList = extractList<Appointment>(appointmentsResponse.data);
        
        // Normalize date for comparison - handle both YYYY-MM-DD and ISO date strings
        const normalizeDate = (dateStr: string | undefined): string => {
          if (!dateStr) return "";
          // If it's already in YYYY-MM-DD format, return as is
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateStr;
          }
          // If it's an ISO string, extract the date part
          if (dateStr.includes("T")) {
            return dateStr.split("T")[0];
          }
          return dateStr;
        };
        
        // Filter for today's scheduled appointments only
        // Checked-in appointments should appear in the queue, not here
        const activeAppointments = appointmentsList.filter(
          (apt) => {
            const aptDate = normalizeDate(apt.date);
            const status = (apt.status || "").toLowerCase();
            const isToday = aptDate === today;
            const isScheduled = status === "scheduled";

            return isToday && isScheduled;
          }
        );
        
        // Sort by time
        activeAppointments.sort((a, b) => {
          const timeA = a.time || "";
          const timeB = b.time || "";
          return timeA.localeCompare(timeB);
        });
        
        const mappedAppointments: UpcomingAppointment[] = activeAppointments.map(
          (apt) => {
            const appointmentReason =
              apt.reason || apt.type || "Consultation";

            return {
            id: apt._id || apt.appointmentId,
            name: apt.patientName || "Unknown Patient",
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName || "Unknown")}&background=random`,
            time: apt.time || "",
              appointmentType: appointmentReason,
            patientId: apt.patientId,
            doctorId: apt.doctorId,
              reason: appointmentReason,
              priority: apt.priority || "medium",
            };
          }
        );
        setUpcomingAppointments(mappedAppointments);
        setTodayAppointments(mappedAppointments.length);
      } else {
        // If API call failed, clear appointments
        setUpcomingAppointments([]);
        setTodayAppointments(0);
      }

      // Fetch doctor-specific stats
      const statsResponse = await get<{
        totalPatients: number;
        todayAppointments: number;
        scheduledToday: number;
        completedToday: number;
        inQueue: number;
        thisWeek: number;
      }>("/api/doctors/me/stats");
      if (statsResponse.success && statsResponse.data) {
        setTotalPatients(statsResponse.data.totalPatients || 0);
        setTodayAppointments(statsResponse.data.todayAppointments || 0);
        setCompletedToday(statsResponse.data.completedToday || 0);
        // inQueue is already set from queue response above
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    const handleQueueUpdate = async () => {
      try {
        if (lastMessage.type === 'patient_checked_in' ||
            lastMessage.type === 'patient_status_updated' ||
            lastMessage.type === 'queue_reordered') {
          // Refresh queue data silently (no loading state)
          await fetchDashboardData(false);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    handleQueueUpdate();
  }, [lastMessage]);

  // Lab reports data
  const [labReports, setLabReports] = useState<Array<{
    id: string;
    patientId: string;
    patientName: string;
    patientAvatar: string;
    reportType: string;
    date: string;
    time: string;
    priority: "high" | "normal" | "low";
    status: "pending" | "reviewed";
  }>>([]);

  // Fetch lab reports
  useEffect(() => {
    const fetchLabReports = async () => {
      if (!user?._id) return;

      try {
        const response = await get<{ data: Array<{
          _id: string;
          patientId: string;
          patientName?: string;
          category: string;
          createdAt: string;
          isCritical?: boolean;
          status?: string;
        }> }>("/api/lab-reports?limit=10");
        
        if (response.success && response.data?.data) {
          const mappedReports = response.data.data.map((report) => ({
            id: report._id,
            patientId: report.patientId,
            patientName: report.patientName || "Unknown Patient",
            patientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(report.patientName || "Unknown")}&background=random`,
            reportType: report.category || "Lab Report",
            date: new Date(report.createdAt).toLocaleDateString(),
            time: new Date(report.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            priority: (report.isCritical ? "high" : "normal") as "high" | "normal" | "low",
            status: (report.status === "reviewed" ? "reviewed" : "pending") as "pending" | "reviewed",
          }));
          setLabReports(mappedReports);
        }
      } catch (err) {
        console.error("Failed to fetch lab reports:", err);
      }
    };

    fetchLabReports();
  }, [user]);

  const handleViewLabReport = (reportId: string) => {
    const report = labReports.find((r) => r.id === reportId);
    if (report) {
      // Open the ViewReportsDialog for this patient
      setReportsOpen(true);
    }
  };

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    source: "appointments" | "queue";
  } | null>(null);

  // Move patient from queue to upcoming
  const moveToUpcoming = (patientId: string) => {
    const patient = queuePatients.find((p) => p.id === patientId);
    if (patient) {
      setQueuePatients((prev) => prev.filter((p) => p.id !== patientId));
      setUpcomingAppointments((prev) => [
        ...prev,
        {
          id: patient.id,
          name: patient.name,
          avatar: patient.avatar,
          time: patient.time,
          appointmentType: patient.appointmentType,
        },
      ]);
    }
  };

  // Move patient from upcoming to queue (persist to backend)
  const moveToQueue = async (appointmentId: string) => {
    const appointment = upcomingAppointments.find((a) => a.id === appointmentId);
    if (!appointment) {
      return;
    }

    try {
      setQueueActionId(appointmentId);

      const response = await post("/api/queue/check-in", {
        appointmentId,
        reason:
          appointment.reason ||
          appointment.appointmentType ||
          "General Consultation",
        priority: appointment.priority || "medium",
        notes: "",
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to add appointment to queue");
      }

      // Optimistically remove from upcoming appointments while data refreshes
      setUpcomingAppointments((prev) =>
        prev.filter((a) => a.id !== appointmentId)
      );

      toast({
        title: "Patient moved to queue",
        description: `${appointment.name} is now waiting for consultation.`,
      });

      // Refresh dashboard data without triggering full-page loading state
      await fetchDashboardData(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to move appointment to queue";

      toast({
        title: "Queue update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setQueueActionId(null);
    }
  };

  const startConsultation = async (queueEntryId: string) => {
    try {
      const response = await put(`/api/queue/${queueEntryId}/start-consultation`, {});
      if (response.success) {
        // Find the patient to get patientId for navigation
        const patient = queuePatients.find(p => p.id === queueEntryId);
        if (patient) {
          // Update local state
          setQueuePatients((prev) =>
            prev.map((p) =>
              p.id === queueEntryId ? { ...p, status: "in-progress" as const } : p
            )
          );
          // Persist auto-recording intent so consultation page can pick it up
          try {
            sessionStorage.setItem(
              "autoConsultationRecording",
              JSON.stringify({
                patientId: patient.patientId || patient.id,
                queueId: queueEntryId,
                createdAt: Date.now(),
              })
            );
          } catch (err) {
            console.warn("Unable to persist auto recording preference", err);
          }

          // Navigate to consultation page using React Router
          const targetPatientId = patient.patientId || patient.id;
          const queueQuery = queueEntryId ? `?queueId=${queueEntryId}` : "";
          navigate(`/consultation/${targetPatientId}${queueQuery}`);
        }
      }
    } catch (err) {
      console.error("Failed to start consultation:", err);
    }
  };

  // Move appointment up/down
  const moveAppointmentUp = (index: number) => {
    if (index > 0) {
      setUpcomingAppointments((prev) => {
        const newList = [...prev];
        [newList[index - 1], newList[index]] = [
          newList[index],
          newList[index - 1],
        ];

        return newList;
      });
    }
  };

  const moveAppointmentDown = (index: number) => {
    setUpcomingAppointments((prev) => {
      if (index < prev.length - 1) {
        const newList = [...prev];
        [newList[index], newList[index + 1]] = [
          newList[index + 1],
          newList[index],
        ];

        return newList;
      }
      return prev;
    });
  };

  // Move queue patient up/down
  const moveQueueUp = (index: number) => {
    if (index > 0) {
      setQueuePatients((prev) => {
        const newList = [...prev];
        [newList[index - 1], newList[index]] = [
          newList[index],
          newList[index - 1],
        ];

        return newList;
      });
    }
  };

  const moveQueueDown = (index: number) => {
    setQueuePatients((prev) => {
      if (index < prev.length - 1) {
        const newList = [...prev];
        [newList[index], newList[index + 1]] = [
          newList[index + 1],
          newList[index],
        ];

        return newList;
      }
      return prev;
    });
  };

  // Drag handlers
  const handleDragStart = (id: string, source: "appointments" | "queue") => {
    setDraggedItem({ id, source });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnAppointments = () => {
    if (draggedItem && draggedItem.source === "queue") {
      moveToUpcoming(draggedItem.id);
    }
    setDraggedItem(null);
  };

  const handleDropOnQueue = async () => {
    if (draggedItem && draggedItem.source === "appointments") {
      await moveToQueue(draggedItem.id);
    }
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Dashboard</h2>
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <NewAppointmentDialog
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
      />

      <AddPatientDialog
        open={addPatientOpen}
        onOpenChange={setAddPatientOpen}
      />

      <WritePrescriptionDialog
        open={prescriptionOpen}
        onOpenChange={setPrescriptionOpen}
      />

      <ViewReportsDialog
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        onViewReport={(reportData) => {
          setSelectedLabReport(reportData);
          setLabReportViewerOpen(true);
          setReportsOpen(false);
        }}
      />

      <MessagesDialog open={messagesOpen} onOpenChange={setMessagesOpen} />

      <LabReportViewerDialog
        open={labReportViewerOpen}
        onOpenChange={setLabReportViewerOpen}
        reportData={selectedLabReport}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back, Dr. {user.firstName} {user.lastName}! Here's your overview for today.
          </p>
        </div>
        {/* WebSocket connection status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Section with Clickable Actions */}
      <DashboardStatsSection
        totalPatients={totalPatients}
        todayAppointments={todayAppointments}
        inQueue={inQueue}
        completedToday={completedToday}
        onNewAppointment={() => setNewAppointmentOpen(true)}
        onAddPatient={() => setAddPatientOpen(true)}
        onWritePrescription={() => setPrescriptionOpen(true)}
        onViewReports={() => setReportsOpen(true)}
        onMessages={() => setMessagesOpen(true)}
      />

      {/* Three Column Section: Appointments, Queue, Lab Reports */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Today's Appointments */}
        <Card className="border-border shadow-md bg-gradient-to-br from-teal-50/40 to-emerald-50/30 dark:from-teal-950/15 dark:to-emerald-950/10">
          <CardHeader className="pb-2 pt-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">
                    Today's Appointments
                  </CardTitle>
                  <p className="text-[10px] text-teal-100 mt-0.5">
                    {upcomingAppointments.length} scheduled
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="h-[500px] overflow-y-auto px-4 pb-3 pt-3 scrollbar-thin scrollbar-thumb-teal-300 dark:scrollbar-thumb-teal-700 scrollbar-track-transparent hover:scrollbar-thumb-teal-400 dark:hover:scrollbar-thumb-teal-600"
              onDragOver={handleDragOver}
              onDrop={handleDropOnAppointments}
            >
              <div className="space-y-2">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No appointments today
                  </p>
                ) : (
                  upcomingAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      draggable
                      onDragStart={() =>
                        handleDragStart(appointment.id, "appointments")
                      }
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group cursor-move"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-teal-100 dark:hover:bg-teal-900/30"
                          onClick={() => moveAppointmentUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUpIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-teal-100 dark:hover:bg-teal-900/30"
                          onClick={() => moveAppointmentDown(index)}
                          disabled={index === upcomingAppointments.length - 1}
                        >
                          <ChevronDownIcon className="w-3 h-3" />
                        </Button>
                      </div>
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage
                          src={appointment.avatar}
                          alt={appointment.name}
                        />

                        <AvatarFallback>
                          {appointment.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {appointment.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] flex-shrink-0"
                            asChild
                          >
                            <Link to={`/patient-overview/${appointment.patientId || appointment.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{appointment.time}</span>
                            <span>•</span>
                            <span className="truncate">
                              {appointment.appointmentType}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white flex-shrink-0 flex items-center gap-1"
            onClick={() => moveToQueue(appointment.id)}
            disabled={queueActionId === appointment.id}
                          >
            {queueActionId === appointment.id ? (
              <>
                <Loader2Icon className="w-3 h-3 animate-spin" />
                Moving...
              </>
            ) : (
              <>
                <ArrowRightIcon className="w-3 h-3" />
                Queue
              </>
            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Queue */}
        <Card className="border-border shadow-md bg-gradient-to-br from-cyan-50/40 to-blue-50/30 dark:from-cyan-950/15 dark:to-blue-950/10">
          <CardHeader className="pb-2 pt-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <UsersRoundIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">
                    Patient Queue
                  </CardTitle>
                  <p className="text-[10px] text-cyan-100 mt-0.5">
                    {queuePatients.filter((p) => p.status === "waiting").length}{" "}
                    waiting •{" "}
                    {
                      queuePatients.filter((p) => p.status === "in-progress")
                        .length
                    }{" "}
                    active
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="h-[500px] overflow-y-auto px-4 pb-3 pt-3 scrollbar-thin scrollbar-thumb-cyan-300 dark:scrollbar-thumb-cyan-700 scrollbar-track-transparent hover:scrollbar-thumb-cyan-400 dark:hover:scrollbar-thumb-cyan-600"
              onDragOver={handleDragOver}
              onDrop={handleDropOnQueue}
            >
              <div className="space-y-2">
                {queuePatients.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      No patients in queue
                    </p>
                  </div>
                ) : (
                  queuePatients.map((patient, index) => (
                    <div
                      key={patient.id}
                      draggable
                      onDragStart={() => handleDragStart(patient.id, "queue")}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group cursor-move"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                          onClick={() => moveQueueUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUpIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                          onClick={() => moveQueueDown(index)}
                          disabled={index === queuePatients.length - 1}
                        >
                          <ChevronDownIcon className="w-3 h-3" />
                        </Button>
                      </div>
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage src={patient.avatar} alt={patient.name} />

                        <AvatarFallback>
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {patient.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] flex-shrink-0"
                            asChild
                          >
                            <Link to={`/patient-overview/${patient.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {patient.time}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-[10px] hover:bg-teal-100 dark:hover:bg-teal-900/30"
                              onClick={() => moveToUpcoming(patient.id)}
                              title="Move to appointments"
                            >
                              <ArrowLeftIcon className="w-3 h-3" />
                            </Button>
                          </div>
                          {patient.status === "waiting" ? (
                            <Button
                              size="sm"
                              className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                              onClick={() => startConsultation(patient.id)}
                            >
                              Start
                            </Button>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0.5 flex-shrink-0">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lab Results */}
        <Card className="border-border shadow-md bg-gradient-to-br from-purple-50/40 to-indigo-50/30 dark:from-purple-950/15 dark:to-indigo-950/10">
          <CardHeader className="pb-2 pt-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <ActivityIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">
                    Lab Results
                  </CardTitle>
                  <p className="text-[10px] text-purple-100 mt-0.5">
                    {labReports.length} pending review
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto px-4 pb-3 pt-3 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
              <div className="space-y-2">
                {labReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage
                        src={report.patientAvatar}
                        alt={report.patientName}
                      />

                      <AvatarFallback>
                        {report.patientName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {report.patientName}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] flex-shrink-0"
                          onClick={() => handleViewLabReport(report.id)}
                        >
                          View
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground truncate">
                          {report.reportType}
                        </span>
                        {report.priority === "high" && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 flex-shrink-0">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics & Analytics Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Doctor Performance Metrics */}
        <Card className="border-border shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg">
                  <ActivityIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm">
                    Performance Insights
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Your key metrics this week
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <p className="text-[10px] text-emerald-50 mb-0.5">
                  Patient Satisfaction
                </p>
                <p className="text-xl font-bold text-white mb-0.5">4.8/5.0</p>
                <span className="text-[10px] text-emerald-50">↑ 5%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <p className="text-[10px] text-blue-50 mb-0.5">
                  Avg. Consultation
                </p>
                <p className="text-xl font-bold text-white mb-0.5">18 min</p>
                <span className="text-[10px] text-blue-50">↓ 12%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
                <p className="text-[10px] text-purple-50 mb-0.5">
                  Follow-up Rate
                </p>
                <p className="text-xl font-bold text-white mb-0.5">92%</p>
                <span className="text-[10px] text-purple-50">↑ 8%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md">
                <p className="text-[10px] text-orange-50 mb-0.5">
                  No-Show Rate
                </p>
                <p className="text-xl font-bold text-white mb-0.5">3.2%</p>
                <span className="text-[10px] text-orange-50">↓ 15%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Analysis Section */}
        <PatientAnalysisSection />
      </div>
    </div>
  );
}
