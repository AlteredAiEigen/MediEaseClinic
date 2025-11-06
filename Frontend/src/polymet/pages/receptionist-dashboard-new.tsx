import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
// import { patients, appointments } from "@/polymet/data/healthcare-data";

type PatientStatus =
  | "scheduled"
  | "checked-in"
  | "waiting"
  | "in-consultation"
  | "awaiting-checkout"
  | "completed";

export function ReceptionistDashboardNew() {
  const [queueTab, setQueueTab] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointmentsList, setAppointmentsList] = useState(
    appointments.filter((apt) => apt.date === "2024-01-20")
  );
  const [patientStatuses, setPatientStatuses] = useState<
    Record<string, PatientStatus>
  >(
    patients.reduce(
      (acc, p) => ({ ...acc, [p.id]: p.status as PatientStatus }),
      {}
    )
  );
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<string>("");
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const queueList = patients.filter((p) => {
    const status = patientStatuses[p.id];
    return (
      status === "checked-in" ||
      status === "waiting" ||
      status === "in-consultation" ||
      status === "awaiting-checkout"
    );
  });

  const checkedInPatients = queueList.filter(
    (p) => patientStatuses[p.id] === "checked-in"
  ).length;
  const waitingPatients = queueList.filter(
    (p) => patientStatuses[p.id] === "waiting"
  ).length;
  const inConsultation = queueList.filter(
    (p) => patientStatuses[p.id] === "in-consultation"
  ).length;
  const awaitingCheckout = queueList.filter(
    (p) => patientStatuses[p.id] === "awaiting-checkout"
  ).length;
  const completedToday = Object.values(patientStatuses).filter(
    (s) => s === "completed"
  ).length;

  const changePatientStatus = (patientId: string, newStatus: PatientStatus) => {
    setPatientStatuses((prev) => ({ ...prev, [patientId]: newStatus }));
  };

  const moveStatusForward = (patientId: string) => {
    const currentStatus = patientStatuses[patientId];
    const statusFlow: PatientStatus[] = [
      "scheduled",
      "checked-in",
      "waiting",
      "in-consultation",
      "awaiting-checkout",
      "completed",
    ];

    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      changePatientStatus(patientId, statusFlow[currentIndex + 1]);
    }
  };

  const moveStatusBackward = (patientId: string) => {
    const currentStatus = patientStatuses[patientId];
    const statusFlow: PatientStatus[] = [
      "scheduled",
      "checked-in",
      "waiting",
      "in-consultation",
      "awaiting-checkout",
      "completed",
    ];

    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex > 0) {
      changePatientStatus(patientId, statusFlow[currentIndex - 1]);
    }
  };

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

  const handleCompleteCheckout = (patientId: string) => {
    changePatientStatus(patientId, "completed");
  };

  const moveToQueue = (appointmentId: string) => {
    const appointment = appointmentsList.find(
      (apt) => apt.id === appointmentId
    );
    if (!appointment) return;
    changePatientStatus(appointment.patientId, "checked-in");
    setAppointmentsList((prev) =>
      prev.filter((apt) => apt.id !== appointmentId)
    );
  };

  const moveToAppointments = (patientId: string) => {
    const appointment = appointments.find((apt) => apt.patientId === patientId);
    if (!appointment) return;
    changePatientStatus(patientId, "scheduled");
    setAppointmentsList((prev) => [...prev, appointment]);
  };

  const removeFromAppointments = (appointmentId: string) => {
    setAppointmentsList((prev) =>
      prev.filter((apt) => apt.id !== appointmentId)
    );
  };

  const filteredQueuePatients = queueList.filter((p) => {
    if (queueTab === "all") return true;
    return patientStatuses[p.id] === queueTab;
  });

  const avgWaitTime =
    queueList.length > 0 ? Math.floor(15 + Math.random() * 20) : 0;
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

      {/* Side by Side: Appointments and Queue */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
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
            <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {appointmentsList.length} scheduled
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {appointmentsList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />

                  <p className="text-sm">No appointments scheduled</p>
                </div>
              ) : (
                appointmentsList.map((apt) => (
                  <div
                    key={apt.id}
                    className="group relative flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-300"
                  >
                    <Avatar className="h-12 w-12 ring-2 ring-border">
                      <AvatarImage src={apt.avatar} />

                      <AvatarFallback>
                        {apt.patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{apt.time}</p>
                      <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs">
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-md transition-all"
                        onClick={() => moveToQueue(apt.id)}
                        title="Check In"
                      >
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-md transition-all"
                        onClick={() => removeFromAppointments(apt.id)}
                        title="Cancel"
                      >
                        <XIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient Queue */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <CardTitle className="text-lg font-semibold">
                  Patient Queue
                </CardTitle>
              </div>
              <Badge className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                {queueList.length} in queue
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={queueTab}
              onValueChange={setQueueTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5 bg-muted mb-4 p-1 rounded-xl">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="checked-in"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs"
                >
                  Checked In
                </TabsTrigger>
                <TabsTrigger
                  value="waiting"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs"
                >
                  Waiting
                </TabsTrigger>
                <TabsTrigger
                  value="in-consultation"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs"
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger
                  value="awaiting-checkout"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs"
                >
                  Checkout
                </TabsTrigger>
              </TabsList>
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {filteredQueuePatients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />

                    <p className="text-sm">No patients in queue</p>
                  </div>
                ) : (
                  filteredQueuePatients.map((patient) => {
                    const apt = appointments.find(
                      (a) => a.patientId === patient.id
                    );
                    const currentStatus = patientStatuses[patient.id];
                    const statusFlow: PatientStatus[] = [
                      "scheduled",
                      "checked-in",
                      "waiting",
                      "in-consultation",
                      "completed",
                    ];

                    const currentIndex = statusFlow.indexOf(currentStatus);
                    const canMoveForward = currentIndex < statusFlow.length - 1;
                    const canMoveBackward = currentIndex > 1;

                    return (
                      <div
                        key={patient.id}
                        className="group relative flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-300"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-border">
                          <AvatarImage src={patient.avatar} />

                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {patient.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {patient.id} • {patient.condition}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {apt?.time || "Walk-in"}
                          </p>
                          <Badge
                            className={
                              currentStatus === "in-consultation"
                                ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                                : currentStatus === "checked-in"
                                  ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                  : currentStatus === "waiting"
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                    : currentStatus === "awaiting-checkout"
                                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            }
                          >
                            {currentStatus === "in-consultation"
                              ? "In Consultation"
                              : currentStatus === "checked-in"
                                ? "Checked In"
                                : currentStatus === "waiting"
                                  ? "Waiting"
                                  : currentStatus === "awaiting-checkout"
                                    ? "Awaiting Checkout"
                                    : currentStatus}
                          </Badge>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {currentStatus === "awaiting-checkout" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 p-0 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:shadow-md transition-all"
                                onClick={() =>
                                  handleUploadPrescription(patient.id)
                                }
                                title="Upload Prescription"
                              >
                                <UploadIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-md transition-all"
                                onClick={() =>
                                  handleCompleteCheckout(patient.id)
                                }
                                title="Complete Checkout"
                              >
                                <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </Button>
                            </>
                          )}
                          {currentStatus !== "awaiting-checkout" && (
                            <>
                              {canMoveBackward && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow-md transition-all"
                                  onClick={() => moveStatusBackward(patient.id)}
                                  title="Move to Previous Status"
                                >
                                  <ChevronLeftIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </Button>
                              )}
                              {canMoveForward && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-md transition-all"
                                  onClick={() => moveStatusForward(patient.id)}
                                  title="Move to Next Status"
                                >
                                  <ChevronRightIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-md transition-all"
                            onClick={() => moveToAppointments(patient.id)}
                            title="Move to Appointments"
                          >
                            <ArrowLeftIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Tabs>
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
            <Link to="/register-patient" className="w-full">
              <Button className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl font-semibold">
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Register New Patient
              </Button>
            </Link>
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
