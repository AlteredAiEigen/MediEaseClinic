import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  SearchIcon,
  AlertCircleIcon,
  ActivityIcon,
  DollarSignIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XIcon,
} from "lucide-react";
import { patients, appointments } from "@/polymet/data/healthcare-data";

export function ReceptionistDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [queueTab, setQueueTab] = useState("all");
  const [appointmentsList, setAppointmentsList] = useState(
    appointments.filter((apt) => apt.date === "2024-01-20")
  );
  const [queueList, setQueueList] = useState(
    patients.filter(
      (p) =>
        p.status === "checked-in" ||
        p.status === "waiting" ||
        p.status === "in-consultation"
    )
  );
  const [awaitingCompletion, setAwaitingCompletion] = useState<string[]>([
    "P005",
  ]);

  const checkedInPatients = queueList.filter(
    (p) => p.status === "checked-in"
  ).length;
  const inConsultation = queueList.filter(
    (p) => p.status === "in-consultation"
  ).length;
  const completedToday = patients.filter(
    (p) => p.status === "completed"
  ).length;
  const todayAppointments = appointmentsList;

  const awaitingPatients = patients.filter((p) =>
    awaitingCompletion.includes(p.id)
  );

  const queuePatients = queueList;

  const handleCheckout = (patientId: string) => {
    setAwaitingCompletion((prev) => prev.filter((id) => id !== patientId));
  };

  const moveToQueue = (appointmentId: string) => {
    const appointment = appointmentsList.find(
      (apt) => apt.id === appointmentId
    );
    if (!appointment) return;

    const patient = patients.find((p) => p.id === appointment.patientId);
    if (!patient) return;

    // Add to queue with checked-in status
    const updatedPatient = { ...patient, status: "checked-in" as const };
    setQueueList((prev) => [...prev, updatedPatient]);

    // Remove from appointments
    setAppointmentsList((prev) =>
      prev.filter((apt) => apt.id !== appointmentId)
    );
  };

  const moveToAppointments = (patientId: string) => {
    const patient = queueList.find((p) => p.id === patientId);
    if (!patient) return;

    // Find the original appointment
    const appointment = appointments.find((apt) => apt.patientId === patientId);
    if (!appointment) return;

    // Add back to appointments
    setAppointmentsList((prev) => [...prev, appointment]);

    // Remove from queue
    setQueueList((prev) => prev.filter((p) => p.id !== patientId));
  };

  const removeFromQueue = (patientId: string) => {
    setQueueList((prev) => prev.filter((p) => p.id !== patientId));
  };

  const removeFromAppointments = (appointmentId: string) => {
    setAppointmentsList((prev) =>
      prev.filter((apt) => apt.id !== appointmentId)
    );
  };

  const filteredQueuePatients = queueList.filter((p) => {
    if (queueTab === "all") return true;
    if (queueTab === "awaiting") return awaitingCompletion.includes(p.id);
    return p.status === queueTab;
  });

  return (
    <div className="space-y-6">
      {/* Premium Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Checked In
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {checkedInPatients}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Consultation
                </p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {inConsultation}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ActivityIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedToday}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appointments
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {todayAppointments.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">
                Today's Schedule
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              >
                {todayAppointments.length} appointments
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointmentsList.map((apt) => {
                  const patient = patients.find((p) => p.id === apt.patientId);
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={apt.avatar} />

                        <AvatarFallback>
                          {apt.patientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{apt.time}</p>
                        <Badge
                          variant="outline"
                          className={
                            apt.status === "completed"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs"
                              : apt.status === "in-progress"
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs"
                                : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs"
                          }
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Patient Queue */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Patient Queue
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                >
                  {queuePatients.length} in queue
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                  <TabsTrigger value="waiting">Waiting</TabsTrigger>
                  <TabsTrigger value="in-consultation">In Progress</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-2 mt-4">
                  {queuePatients.map((patient) => {
                    const apt = appointments.find(
                      (a) => a.patientId === patient.id
                    );
                    return (
                      <div
                        key={patient.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={patient.avatar} />

                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {patient.id} • {patient.condition}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">
                            {apt?.time || "Walk-in"}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              patient.status === "in-consultation"
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs"
                                : patient.status === "checked-in"
                                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs"
                                  : "bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 text-xs"
                            }
                          >
                            {patient.status === "in-consultation"
                              ? "In Consultation"
                              : patient.status === "checked-in"
                                ? "Checked In"
                                : "Waiting"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
                <TabsContent value="checked-in" className="space-y-2 mt-4">
                  {queuePatients
                    .filter((p) => p.status === "checked-in")
                    .map((patient) => {
                      const apt = appointments.find(
                        (a) => a.patientId === patient.id
                      );
                      return (
                        <div
                          key={patient.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.avatar} />

                            <AvatarFallback>
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {patient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.id} • {patient.condition}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">
                              {apt?.time || "Walk-in"}
                            </p>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs"
                            >
                              Checked In
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </TabsContent>
                <TabsContent value="waiting" className="space-y-2 mt-4">
                  {queuePatients
                    .filter((p) => p.status === "waiting")
                    .map((patient) => {
                      const apt = appointments.find(
                        (a) => a.patientId === patient.id
                      );
                      return (
                        <div
                          key={patient.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.avatar} />

                            <AvatarFallback>
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {patient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.id} • {patient.condition}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">
                              {apt?.time || "Walk-in"}
                            </p>
                            <Badge
                              variant="outline"
                              className="bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 text-xs"
                            >
                              Waiting
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </TabsContent>
                <TabsContent value="in-consultation" className="space-y-2 mt-4">
                  {queuePatients
                    .filter((p) => p.status === "in-consultation")
                    .map((patient) => {
                      const apt = appointments.find(
                        (a) => a.patientId === patient.id
                      );
                      return (
                        <div
                          key={patient.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.avatar} />

                            <AvatarFallback>
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {patient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.id} • {patient.condition}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">
                              {apt?.time || "Walk-in"}
                            </p>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs"
                            >
                              In Consultation
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Awaiting Completion */}
          <Card className="border-border shadow-sm border-l-4 border-l-rose-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Awaiting Checkout
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                >
                  {awaitingPatients.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {awaitingPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />

                  <p className="text-sm">No patients awaiting checkout</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {awaitingPatients.map((patient) => {
                    const apt = appointments.find(
                      (a) => a.patientId === patient.id
                    );
                    return (
                      <div
                        key={patient.id}
                        className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.avatar} />

                            <AvatarFallback>
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {patient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.id}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {patient.condition}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleCheckout(patient.id)}
                          >
                            <DollarSignIcon className="h-3 w-3 mr-1" />
                            Complete Checkout
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Register New Patient
              </Button>
              <Button variant="outline" className="w-full">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full">
                <UsersIcon className="w-4 h-4 mr-2" />
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
