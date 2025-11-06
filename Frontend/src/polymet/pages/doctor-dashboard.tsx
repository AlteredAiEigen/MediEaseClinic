import { useState } from "react";
import { Link } from "react-router-dom";
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
import { getLabReportsForPatient } from "@/polymet/data/lab-reports-data";
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
} from "lucide-react";

interface QueuePatient {
  id: string;
  name: string;
  avatar: string;
  time: string;
  appointmentType: string;
  status: "waiting" | "in-progress";
}

interface UpcomingAppointment {
  id: string;
  name: string;
  avatar: string;
  time: string;
  appointmentType: string;
}

export function DoctorDashboard() {
  const totalPatients = 156;
  const todayAppointments = 8;
  const inQueue = 3;
  const completedToday = 2;

  // Dialog states
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<any>(null);

  // Queue patients state - can be moved to upcoming
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([
    {
      id: "Q-001",
      name: "Rajesh Kumar Sharma",
      avatar: "https://github.com/yusufhilmi.png",
      time: "09:00 AM",
      appointmentType: "Follow-up",
      status: "waiting",
    },
    {
      id: "Q-002",
      name: "Priya Menon",
      avatar: "https://github.com/kdrnp.png",
      time: "09:30 AM",
      appointmentType: "New Patient",
      status: "waiting",
    },
    {
      id: "Q-003",
      name: "Mohammed Farhan Khan",
      avatar: "https://github.com/denizbuyuktas.png",
      time: "10:00 AM",
      appointmentType: "Follow-up",
      status: "in-progress",
    },
  ]);

  // Upcoming appointments state - can receive from queue
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([
    {
      id: "U-001",
      name: "Arjun Desai",
      avatar: "https://github.com/shoaibux1.png",
      time: "10:30 AM",
      appointmentType: "Routine Checkup",
    },
  ]);

  // Lab reports data
  const [labReports] = useState([
    {
      id: "1",
      patientId: "P004",
      patientName: "Lakshmi Iyer",
      patientAvatar: "https://github.com/yahyabedirhan.png",
      reportType: "Blood Test Results",
      date: "2024-01-20",
      time: "08:02 AM",
      priority: "high" as const,
      status: "pending" as const,
    },
    {
      id: "2",
      patientId: "P006",
      patientName: "Anjali Gupta",
      patientAvatar: "https://github.com/shoaibux1.png",
      reportType: "X-Ray Report",
      date: "2024-01-20",
      time: "07:15 AM",
      priority: "normal" as const,
      status: "pending" as const,
    },
  ]);

  const handleViewLabReport = (reportId: string) => {
    const report = labReports.find((r) => r.id === reportId);
    if (report) {
      const patientReports = getLabReportsForPatient(report.patientId);
      if (patientReports.length > 0) {
        setSelectedLabReport(patientReports[0]);
        setLabReportViewerOpen(true);
      }
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

  // Move patient from upcoming to queue
  const moveToQueue = (appointmentId: string) => {
    const appointment = upcomingAppointments.find(
      (a) => a.id === appointmentId
    );
    if (appointment) {
      setUpcomingAppointments((prev) =>
        prev.filter((a) => a.id !== appointmentId)
      );
      setQueuePatients((prev) => [
        ...prev,
        {
          id: appointment.id,
          name: appointment.name,
          avatar: appointment.avatar,
          time: appointment.time,
          appointmentType: appointment.appointmentType,
          status: "waiting",
        },
      ]);
    }
  };

  const startConsultation = (patientId: string) => {
    setQueuePatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, status: "in-progress" as const } : p
      )
    );
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

  const handleDropOnQueue = () => {
    if (draggedItem && draggedItem.source === "appointments") {
      moveToQueue(draggedItem.id);
    }
    setDraggedItem(null);
  };

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
            Welcome back, Dr. Mitchell! Here's your overview for today.
          </p>
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
              className="max-h-[280px] overflow-y-auto px-4 pb-3 pt-3 scrollbar-thin scrollbar-thumb-teal-300 dark:scrollbar-thumb-teal-700 scrollbar-track-transparent hover:scrollbar-thumb-teal-400 dark:hover:scrollbar-thumb-teal-600"
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
                            <Link to={`/patient-details/${appointment.id}`}>
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
                          >
                            <ArrowRightIcon className="w-3 h-3" />
                            Queue
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
              className="max-h-[280px] overflow-y-auto px-4 pb-3 pt-3 scrollbar-thin scrollbar-thumb-cyan-300 dark:scrollbar-thumb-cyan-700 scrollbar-track-transparent hover:scrollbar-thumb-cyan-400 dark:hover:scrollbar-thumb-cyan-600"
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
                            <Link to={`/patient-details/${patient.id}`}>
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
                              asChild
                            >
                              <Link to={`/consultation/${patient.id}`}>
                                Start
                              </Link>
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
            <div className="max-h-[280px] overflow-y-auto px-4 pb-3 pt-3 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
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
