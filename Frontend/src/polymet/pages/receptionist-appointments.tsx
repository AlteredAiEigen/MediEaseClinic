import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  Loader2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { get, post, put, del } from "@/lib/api-client";

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
  if (rawData && Array.isArray(rawData.patients)) {
    return rawData.patients as T[];
  }
  if (rawData && Array.isArray(rawData.doctors)) {
    return rawData.doctors as T[];
  }
  return [];
};

const formatAppointmentTime = (date?: string, time?: string) => {
  if (!time) return "—";
  const trimmed = time.trim();
  if (/[AP]M$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (!date) return trimmed;
  const parsed = new Date(`${date}T${trimmed}`);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }
  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const startOfWeek = (reference: Date) => {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
};

const endOfWeek = (reference: Date) => {
  const end = startOfWeek(reference);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const endOfDay = (reference: Date) => {
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isSameDay = (target: Date, comparison: Date) =>
  target.toDateString() === comparison.toDateString();

const isWithinRange = (target: Date, start: Date, end: Date) =>
  target >= start && target <= end;

const formatLabel = (value?: string) => {
  if (!value) return "";
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export function ReceptionistAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");
  const hasProcessedUrlParam = useRef(false);
  
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
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reschedule dialog state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const doctorNameMap = useMemo(() => {
    const map = new Map<string, string>();
    doctors.forEach((doc) => {
      const fullName =
        doc.fullName || [doc.firstName, doc.lastName].filter(Boolean).join(" ").trim();
      if (doc._id && fullName) {
        map.set(doc._id, fullName);
      }
    });
    return map;
  }, [doctors]);

  const selectedDateObj = useMemo(() => {
    const parsed = normalizeDate(selectedDate);
    return parsed ?? new Date();
  }, [selectedDate]);

  const weekStart = useMemo(() => startOfWeek(selectedDateObj), [selectedDateObj]);
  const weekEnd = useMemo(() => endOfWeek(selectedDateObj), [selectedDateObj]);

  const sourceAppointments = useMemo(
    () => (allAppointments.length > 0 ? allAppointments : appointments),
    [allAppointments, appointments]
  );

  const todayAppointments = appointments;

  const activeStatuses = useMemo(
    () => new Set(["scheduled", "in-progress", "checked-in", "completed"]),
    []
  );

  const weekAppointments = useMemo(() => {
    return sourceAppointments.filter((apt) => {
      const dateValue = normalizeDate(apt.date);
      if (!dateValue) return false;
      return isWithinRange(dateValue, weekStart, weekEnd);
    });
  }, [sourceAppointments, weekStart, weekEnd]);

  const weekAppointmentsCount = weekAppointments.length;

  const completedThisWeek = useMemo(
    () => weekAppointments.filter((apt) => apt.status === "completed").length,
    [weekAppointments]
  );

  const scheduledThisWeek = useMemo(
    () =>
      weekAppointments.filter((apt) => (apt.status ? activeStatuses.has(apt.status) : false))
        .length,
    [weekAppointments, activeStatuses]
  );

  const todayCompleted = useMemo(
    () => todayAppointments.filter((apt) => apt.status === "completed").length,
    [todayAppointments]
  );

  const todayScheduled = useMemo(
    () =>
      todayAppointments.filter((apt) => (apt.status ? activeStatuses.has(apt.status) : false))
        .length,
    [todayAppointments, activeStatuses]
  );

  // Fetch patients and doctors on initial mount
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    fetchAllAppointmentsForMonth();
  }, [date]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await get(`/api/appointments?date=${selectedDate}&limit=100`);
      if (response.success) {
        const appointmentsData = extractList<Appointment>(response.data);
        setAppointments(appointmentsData);
      } else {
        setAppointments([]);
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllAppointmentsForMonth = async () => {
    try {
      if (!date) return;

      // Get first and last day of the current month
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      // For now, we'll fetch appointments for each day of the month
      // In a real implementation, you might want an API endpoint that accepts date ranges
      const monthAppointments: Appointment[] = [];

      // Loop through each day of the month
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        try {
          const response = await get(`/api/appointments?date=${dateStr}&limit=100`);
          if (response.success) {
            const dayAppointments = extractList<Appointment>(response.data);
            monthAppointments.push(...dayAppointments);
          }
        } catch (err) {
          // Silently ignore errors for individual days
          console.warn(`Failed to fetch appointments for ${dateStr}:`, err);
        }
      }

      setAllAppointments(monthAppointments);
    } catch (err) {
      console.error("Failed to load month appointments:", err);
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

  // Pre-select patient from URL parameter and open appointment dialog
  useEffect(() => {
    // Only proceed if we have a patientId in URL, patients have been loaded, and we haven't processed it yet
    if (!patientIdFromUrl || patients.length === 0 || hasProcessedUrlParam.current) {
      return;
    }

    // Try to find patient by _id or patientId (handle both MongoDB ObjectId and patientId string)
    const foundPatient = patients.find(
      (p) => {
        const pId = String(p._id || "");
        const pPatientId = String(p.patientId || "");
        const urlId = String(patientIdFromUrl);
        return pId === urlId || pPatientId === urlId;
      }
    );
    
    if (foundPatient) {
      console.log("Found patient for pre-selection:", foundPatient);
      // Set patient selection first
      setSelectedPatient(String(foundPatient._id));
      // Set search query to patient name so it appears in the search field
      setSearchQuery(foundPatient.fullName || `${foundPatient.patientId}`);
      // Open dialog after a small delay to ensure state is set
      setTimeout(() => {
        setIsNewAppointmentOpen(true);
      }, 100);
      hasProcessedUrlParam.current = true;
      
      // Clear the URL parameter after using it
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("patientId");
        return newParams;
      });
    } else {
      console.warn("Patient not found with ID:", patientIdFromUrl);
      console.log("Available patients:", patients.map(p => ({ 
        _id: String(p._id), 
        patientId: String(p.patientId),
        fullName: p.fullName 
      })));
      hasProcessedUrlParam.current = true; // Mark as processed even if not found to avoid infinite retries
    }
  }, [patientIdFromUrl, patients, setSearchParams]);

  // Ensure search query shows patient name when patient is selected but search query is empty
  useEffect(() => {
    if (selectedPatient && !searchQuery && patients.length > 0) {
      const selectedPatientObj = patients.find(p => String(p._id) === String(selectedPatient));
      if (selectedPatientObj) {
        setSearchQuery(selectedPatientObj.fullName || `${selectedPatientObj.patientId}`);
      }
    }
  }, [selectedPatient, patients, searchQuery]);

  const fetchDoctors = async () => {
    try {
      const response = await get("/api/doctors?limit=100");
      if (response.success) {
        const doctorsData = extractList<Doctor>(response.data);
        setDoctors(doctorsData);
        if (doctorsData.length === 0) {
          console.warn("No doctors found. Make sure doctors have the same clinicId as the receptionist.");
        }
      } else {
        console.error("Failed to load doctors:", response.message);
        setDoctors([]);
      }
    } catch (err) {
      console.error("Failed to load doctors:", err);
      setDoctors([]);
    }
  };

  const filteredAppointments =
    statusFilter === "all"
      ? todayAppointments
      : todayAppointments.filter((apt) => apt.status === statusFilter);

  const filteredPatients = useMemo(() => {
    // If a patient is selected, always include them in the results
    const selectedPatientObj = selectedPatient 
      ? patients.find(p => String(p._id) === String(selectedPatient))
      : null;
    
    if (!debouncedSearchQuery.trim()) {
      // If no search query, show selected patient first, then first 10 patients
      if (selectedPatientObj) {
        const others = patients.filter(p => String(p._id) !== String(selectedPatient));
        return [selectedPatientObj, ...others.slice(0, 9)];
      }
      return patients.slice(0, 10);
    }
    
    // Filter by search query
    const filtered = patients.filter((p) =>
      p.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    
    // If selected patient is not in filtered results, add them at the top
    if (selectedPatientObj && !filtered.find(p => String(p._id) === String(selectedPatient))) {
      return [selectedPatientObj, ...filtered];
    }
    
    return filtered;
  }, [patients, debouncedSearchQuery, selectedPatient]);

  // Get unique dates that have appointments for calendar modifiers
  const appointmentDates = Array.from(
    new Set(
      allAppointments
        .map(apt => apt.date)
        .filter(date => date) // Filter out null/undefined dates
    )
  ).map(dateStr => new Date(dateStr));

  // Calendar modifiers to highlight dates with appointments
  const modifiers = {
    hasAppointment: appointmentDates,
  };

  const modifiersClassNames = {
    hasAppointment: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold",
  };

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
        fetchAllAppointmentsForMonth();
      }
    } catch (err) {
      console.error("Failed to update appointment status:", err);
      alert(err instanceof Error ? err.message : "Failed to update appointment status");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await del(`/api/appointments/${appointmentId}`);

      if (response.success) {
        alert("Appointment cancelled successfully");
        fetchAppointments();
        fetchAllAppointmentsForMonth();
      } else {
        alert(response.message || "Failed to cancel appointment");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel appointment";
      alert(message);
      console.error("Failed to cancel appointment:", err);
    }
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDate(appointment.date);
    setRescheduleTime(appointment.time);
    setIsRescheduleOpen(true);
  };

  const handleRescheduleAppointment = async () => {
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleTime) {
      alert("Please select both date and time");
      return;
    }

    try {
      setIsRescheduling(true);
      const response = await put(`/api/appointments/${rescheduleAppointment._id || rescheduleAppointment.appointmentId}`, {
        date: rescheduleDate,
        time: rescheduleTime,
      });

      if (response.success) {
        alert("Appointment rescheduled successfully");
        setIsRescheduleOpen(false);
        setRescheduleAppointment(null);
        setRescheduleDate("");
        setRescheduleTime("");
        fetchAppointments();
        fetchAllAppointmentsForMonth();
      } else {
        alert(response.message || "Failed to reschedule appointment");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reschedule appointment";
      alert(message);
      console.error("Failed to reschedule appointment:", err);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appointments This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {weekAppointmentsCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Week of {weekStart.toLocaleDateString()} – {weekEnd.toLocaleDateString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/10 border-teal-200 dark:border-teal-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appointments Today
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {todayAppointments.length}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedDateObj.toLocaleDateString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {completedThisWeek}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Today: {todayCompleted}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Scheduled This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {scheduledThisWeek}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Today: {todayScheduled}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
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
          <CardContent className="p-0">
            <Calendar
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                  setSelectedDate(selectedDate.toISOString().split("T")[0]);
                }
              }}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
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
                        {(searchQuery || selectedPatient) && (
                          <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                            {filteredPatients.length > 0 ? filteredPatients.map((patient) => {
                              const isSelected = String(patient._id) === String(selectedPatient);
                              return (
                              <div
                                key={patient._id}
                                className={`flex items-center gap-3 p-3 hover:bg-accent cursor-pointer border-b border-border last:border-0 ${
                                  isSelected ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800" : ""
                                }`}
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
                                {isSelected && (
                                  <div className="ml-auto">
                                    <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300">
                                      Selected
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              );
                            }) : (
                              <div className="p-3 text-center text-sm text-muted-foreground">
                                No patients found matching "{searchQuery}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Patient */}
                      {selectedPatient && (() => {
                        const selectedPatientObj = patients.find(p => String(p._id) === String(selectedPatient));
                        return (
                          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-md border border-teal-200 dark:border-teal-800">
                            <p className="text-sm font-medium">
                              Selected Patient:
                            </p>
                            <p className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                              {selectedPatientObj?.fullName || searchQuery || "Patient selected"}
                            </p>
                            {selectedPatientObj?.patientId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ID: {selectedPatientObj.patientId}
                              </p>
                            )}
                          </div>
                        );
                      })()}

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
              {filteredAppointments.map((appointment) => {
                const doctorName =
                  appointment.doctorName ||
                  doctorNameMap.get(appointment.doctorId) ||
                  (appointment as any).doctor?.fullName ||
                  [(appointment as any).doctor?.firstName, (appointment as any).doctor?.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                  "Doctor not assigned";
                const formattedTime = formatAppointmentTime(appointment.date, appointment.time);

                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-white/80 p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-slate-900/80"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 border border-border shadow-sm">
                          <AvatarImage
                            src={appointment.avatar}
                            alt={appointment.patientName}
                          />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <UserIcon className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-foreground">
                            {appointment.patientName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.reason || "General consultation"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Doctor: {doctorName}
                            {appointment.type
                              ? ` • ${formatLabel(appointment.type)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className="text-sm font-semibold text-foreground">
                          {formattedTime}
                        </span>
                        <Badge className={`${getStatusColor(appointment.status)} capitalize`}>
                          {appointment.status?.replace("-", " ") || "scheduled"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border hover:bg-teal-50 dark:hover:bg-teal-950/20"
                        onClick={() => handleRescheduleClick(appointment)}
                        disabled={
                          appointment.status === "cancelled" || appointment.status === "completed"
                        }
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                        onClick={() =>
                          handleCancelAppointment(appointment._id || appointment.appointmentId)
                        }
                        disabled={
                          appointment.status === "cancelled" || appointment.status === "completed"
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Update the date and time for this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {rescheduleAppointment && (
              <>
                <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-md border border-teal-200 dark:border-teal-800">
                  <p className="text-sm font-medium text-muted-foreground">Patient</p>
                  <p className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                    {rescheduleAppointment.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {rescheduleAppointment.date} at {rescheduleAppointment.time}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New Date *</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">New Time *</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsRescheduleOpen(false);
                setRescheduleAppointment(null);
                setRescheduleDate("");
                setRescheduleTime("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              onClick={handleRescheduleAppointment}
              disabled={!rescheduleDate || !rescheduleTime || isRescheduling}
            >
              {isRescheduling ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                "Reschedule Appointment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
