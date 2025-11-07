import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  UserIcon,
  SearchIcon,
  FilterIcon,
  TrendingUpIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { get, post, put } from "@/lib/api-client";

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  notes?: string;
  patientName?: string;
  doctorName?: string;
}

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

export function ReceptionistAppointments() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms debounce
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [appointmentReason, setAppointmentReason] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await get<{ data: Appointment[] }>(`/api/appointments?date=${selectedDate}`);
      if (response.success && response.data?.data) {
        setAppointments(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await get<{ data: Patient[] }>("/api/patients?limit=100");
      if (response.success && response.data?.data) {
        setPatients(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await get<{ doctors: Doctor[] }>("/api/doctors?limit=100");
      if (response.success && response.data?.doctors) {
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      console.error("Failed to load doctors:", err);
    }
  };

  const todayAppointments = appointments;

  const filteredAppointments =
    statusFilter === "all"
      ? todayAppointments
      : todayAppointments.filter((apt) => apt.status === statusFilter);

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "in-progress":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      case "completed":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "follow-up":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "emergency":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "checkup":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !selectedDoctor || !appointmentTime) {
      return;
    }

    try {
      setIsCreating(true);
      const response = await post("/api/appointments", {
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: appointmentTime,
        type: appointmentType,
        reason: appointmentReason,
        status: "scheduled",
      });

      if (response.success) {
        setIsNewAppointmentOpen(false);
        // Reset form
        setSelectedPatient("");
        setSelectedDoctor("");
        setAppointmentTime("");
        setAppointmentType("consultation");
        setAppointmentReason("");
        setSearchQuery("");
        // Refresh appointments
        fetchAppointments();
      }
    } catch (err) {
      console.error("Failed to create appointment:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await put(`/api/appointments/${appointmentId}/status`, {
        status: newStatus,
      });

      if (response.success) {
        fetchAppointments();
      }
    } catch (err) {
      console.error("Failed to update appointment status:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/10 border-teal-200 dark:border-teal-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Total
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {todayAppointments.length}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <TrendingUpIcon className="w-3 h-3" />
                  +8% vs yesterday
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {
                    todayAppointments.filter((a) => a.status === "completed")
                      .length
                  }
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Scheduled
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {
                    todayAppointments.filter((a) => a.status === "scheduled")
                      .length
                  }
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">42</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border border-border"
            />

            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setDate(new Date())}
              >
                Jump to Today
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2 border-border shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Appointments for {date?.toLocaleDateString()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Dialog
                  open={isNewAppointmentOpen}
                  onOpenChange={setIsNewAppointmentOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      New Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Schedule New Appointment</DialogTitle>
                      <DialogDescription>
                        Search for a patient and schedule their appointment
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Patient Search */}
                      <div className="space-y-2">
                        <Label htmlFor="patient-search">Search Patient</Label>
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                          <Input
                            id="patient-search"
                            placeholder="Search by patient name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {searchQuery && (
                          <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                            {filteredPatients.map((patient) => (
                              <div
                                key={patient._id}
                                className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                                onClick={() => {
                                  setSelectedPatient(patient._id);
                                  setSearchQuery(patient.fullName);
                                }}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName)}&background=random`} />

                                  <AvatarFallback>
                                    {patient.fullName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{patient.fullName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {patient.patientId}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Patient */}
                      {selectedPatient && (
                        <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-md border border-teal-200 dark:border-teal-800">
                          <p className="text-sm font-medium">
                            Selected Patient:
                          </p>
                          <p className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                            {searchQuery || "Patient selected"}
                          </p>
                        </div>
                      )}

                      {/* Doctor Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="doctor-select">Select Doctor</Label>
                        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor._id} value={doctor._id}>
                                {doctor.fullName || `${doctor.firstName} ${doctor.lastName}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Appointment Details */}
                      <div className="space-y-2">
                        <Label htmlFor="appointment-time">Time</Label>
                        <Input
                          id="appointment-time"
                          type="time"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="appointment-type">
                          Appointment Type
                        </Label>
                        <Select
                          value={appointmentType}
                          onValueChange={setAppointmentType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultation">
                              Consultation
                            </SelectItem>
                            <SelectItem value="follow-up">Follow-up</SelectItem>
                            <SelectItem value="checkup">Checkup</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="appointment-reason">Reason</Label>
                        <Textarea
                          id="appointment-reason"
                          placeholder="Enter reason for appointment..."
                          value={appointmentReason}
                          onChange={(e) => setAppointmentReason(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsNewAppointmentOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                          onClick={handleCreateAppointment}
                          disabled={
                            !selectedPatient ||
                            !selectedDoctor ||
                            !appointmentTime ||
                            !appointmentType ||
                            isCreating
                          }
                        >
                          {isCreating ? (
                            <>
                              <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            "Schedule Appointment"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <FilterIcon className="w-4 h-4 mr-2" />

                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-all duration-200 bg-card"
                >
                  <div className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <span className="text-2xl font-bold text-foreground">
                      {appointment.time.split(":")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {appointment.time.split(" ")[1]}
                    </span>
                  </div>

                  <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                    <AvatarImage
                      src={appointment.avatar}
                      alt={appointment.patientName}
                    />

                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-semibold">
                      {appointment.patientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">
                      {appointment.patientName}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {appointment.reason}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getTypeColor(appointment.type)}>
                        {appointment.type}
                      </Badge>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-teal-50 dark:hover:bg-teal-950/20 border-teal-200 dark:border-teal-800"
                    >
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
