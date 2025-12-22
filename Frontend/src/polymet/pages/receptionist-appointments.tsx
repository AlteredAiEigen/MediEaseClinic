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
import { get, post, put, patch } from "@/lib/api-client";
import { formatLocalYYYYMMDD, todayLocalYYYYMMDD } from "@/lib/date";
import type { BillingItem } from "@/polymet/pages/admin-billing";
import { NewAppointmentDialog } from "@/polymet/components/new-appointment-dialog";

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
  doctorId?: string;
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

const formatAppointmentTime = (time?: string) => {
  if (!time) return "-- --";

  const trimmed = time.trim();
  if (/am|pm/i.test(trimmed)) {
    const [timePart, period] = trimmed.split(/\s+/);
    return `${timePart ?? trimmed}${period ? ` ${period.toUpperCase()}` : ""}`.trim();
  }

  const [rawHours, rawMinutes = "00"] = trimmed.split(":");
  const hoursNum = Number(rawHours);

  if (Number.isNaN(hoursNum)) return trimmed;

  const period = hoursNum >= 12 ? "PM" : "AM";
  const normalizedHours = hoursNum % 12 || 12;
  const hoursText = normalizedHours.toString().padStart(2, "0");
  const minutesText = rawMinutes.padStart(2, "0");

  return `${hoursText}:${minutesText} ${period}`;
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

// Helper function to check if appointment date is in the past
const isPastAppointment = (appointmentDate: string): boolean => {
  if (!appointmentDate || typeof appointmentDate !== 'string') return false;
  try {
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    // Normalize appointment date to YYYY-MM-DD format (in case it has time component)
    let aptDateStr = appointmentDate.trim();
    // Remove time component if present (handles both ISO format and space-separated)
    aptDateStr = aptDateStr.split('T')[0].split(' ')[0];
    
    // Validate format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(aptDateStr)) {
      // Try to parse as Date and reformat
      const parsedDate = new Date(appointmentDate);
      if (isNaN(parsedDate.getTime())) return false;
      const aptYear = parsedDate.getFullYear();
      const aptMonth = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const aptDay = String(parsedDate.getDate()).padStart(2, '0');
      aptDateStr = `${aptYear}-${aptMonth}-${aptDay}`;
    }
    
    // Compare as strings (YYYY-MM-DD format) to avoid timezone issues
    const isPast = aptDateStr < todayStr;
    return isPast;
  } catch (error) {
    console.warn('Error checking if appointment is past:', error, appointmentDate);
    return false;
  }
};

export function ReceptionistAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");
  const hasProcessedUrlParam = useRef(false);
  
  const [selectedDate, setSelectedDate] = useState(todayLocalYYYYMMDD());
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms debounce
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [bookingKind, setBookingKind] = useState<"doctor" | "lab-test">("doctor");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

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

  // Derived billing-based options
  const appointmentPricingItems = useMemo(
    () => billingItems.filter((item) => item.category === "appointmentType" && item.isActive),
    [billingItems]
  );

  const labTestPricingItems = useMemo(
    () => billingItems.filter((item) => item.category === "test" && item.isActive),
    [billingItems]
  );

  // Fetch patients, doctors, and billing items on initial mount
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchBillingItems();
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
        const appointmentsData = extractList<Appointment>(response.data).map((apt) => {
          if (apt.type) return apt;
          return {
            ...apt,
            type: apt.doctorId ? "Doctor Appointment" : "Lab Test",
          };
        });
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

      const startDate = formatLocalYYYYMMDD(firstDay);
      const endDate = formatLocalYYYYMMDD(lastDay);

      // For now, we'll fetch appointments for each day of the month
      // In a real implementation, you might want an API endpoint that accepts date ranges
      const monthAppointments: Appointment[] = [];

      // Loop through each day of the month
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = formatLocalYYYYMMDD(d);
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

  const fetchBillingItems = async () => {
    try {
      const response = await get<{ items: BillingItem[] }>("/api/admin/billing-items");
      if (response.success && response.data?.items) {
        setBillingItems(response.data.items);
      }
    } catch (err) {
      console.error("Failed to load billing items:", err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
      case "checked-in":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400";
      case "ongoing":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "in-progress":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "checkout":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400";
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400";
      case "no-show":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400";
    }
  };

  const handleCreateOrUpdateAppointment = async () => {
    if (!selectedPatient || !appointmentTime) {
      setError("Please fill in all required fields");
      return;
    }

    if (bookingKind === "doctor" && !selectedDoctor) {
      setError("Please select a doctor for this appointment");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const payload: Record<string, unknown> = {
        patientId: selectedPatient,
        date: selectedDate,
        time: appointmentTime,
        type: appointmentType,
        reason:
          bookingKind === "doctor"
            ? appointmentPricingItems.find((i) => i.key === appointmentType)?.label ||
              "Doctor appointment"
            : labTestPricingItems.find((i) => i.key === appointmentType)?.label ||
              "Lab test appointment",
        notes: appointmentReason || "",
        bookingKind: bookingKind,
      };

      // Only send doctorId when booking a doctor appointment
      if (bookingKind === "doctor" && selectedDoctor) {
        payload.doctorId = selectedDoctor;
      }

      let response;
      if (editingAppointment) {
        // Update existing appointment
        response = await put(`/api/appointments/${editingAppointment._id}`, payload);
      } else {
        // Create new appointment
        response = await post("/api/appointments", payload);
      }

      if (response.success) {
        setIsNewAppointmentOpen(false);
        setEditingAppointment(null);
        // Reset form
        setSelectedPatient("");
        setSelectedDoctor("");
        setAppointmentTime("");
        setBookingKind("doctor");
        setAppointmentType("consultation");
        setAppointmentReason("");
        setSearchQuery("");
        // Refresh appointments
        fetchAppointments();
        fetchAllAppointmentsForMonth();
      } else {
        setError(response.message ?? "Failed to create appointment");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create appointment";
      setError(message);
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

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      const response = await patch<{ appointment: Appointment }>(
        `/api/appointments/${appointmentToCancel._id}/status`,
        { status: "cancelled" }
      );
      if (response.success && response.data?.appointment) {
        setCancelDialogOpen(false);
        setAppointmentToCancel(null);
        fetchAppointments();
        fetchAllAppointmentsForMonth();
      } else {
        setError(response.message ?? "Failed to cancel appointment");
      }
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel appointment"
      );
    }
  };

  const formatAppointmentDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
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
                  setSelectedDate(formatLocalYYYYMMDD(selectedDate));
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
                <Button 
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
                  onClick={() => {
                    setEditingAppointment(null);
                    setIsNewAppointmentOpen(true);
                  }}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
                
                {/* New Appointment Dialog */}
                <NewAppointmentDialog
                  open={isNewAppointmentOpen}
                  onOpenChange={(open) => {
                    setIsNewAppointmentOpen(open);
                    if (!open) {
                      setEditingAppointment(null);
                    }
                  }}
                  editingAppointment={editingAppointment || undefined}
                  onAppointmentUpdated={() => {
                    fetchAppointments();
                    fetchAllAppointmentsForMonth();
                  }}
                />
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
                const formattedTime = formatAppointmentTime(appointment.time);

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-all duration-200 bg-card"
                  >
                    <Avatar className="w-12 h-12 border-2 border-[#00C4B3]/20">
                      <AvatarImage
                        src={appointment.avatar}
                        alt={appointment.patientName}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                        {(appointment.patientName || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {appointment.patientName || "Unknown Patient"}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            ID: {appointment.appointmentId}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={appointment.doctorId ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400" : "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400"}>
                              {appointment.doctorId ? "Doctor Appointment" : "Lab Test"}
                            </Badge>
                            <Badge className={getStatusBadge(appointment.status)}>
                              {appointment.status?.replace("-", " ") || "scheduled"}
                            </Badge>
                          </div>
                          {(appointment.reason || appointment.notes) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {appointment.reason || appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formattedTime}
                          </p>
                          {appointment.doctorId && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserIcon className="w-4 h-4" />
                              <span>{doctorName}</span>
                            </div>
                          )}
                          {!isPastAppointment(appointment.date) && (
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setEditingAppointment(appointment);
                                  setIsNewAppointmentOpen(true);
                                }}
                                disabled={
                                  appointment.status === "cancelled" || appointment.status === "completed"
                                }
                              >
                                Edit
                              </Button>
                              {appointment.status !== "cancelled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => {
                                    setAppointmentToCancel(appointment);
                                    setCancelDialogOpen(true);
                                  }}
                                  disabled={
                                    appointment.status === "cancelled" || appointment.status === "completed"
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
                    min={todayLocalYYYYMMDD()}
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

      {/* Cancel Appointment Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              {appointmentToCancel && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to cancel the appointment scheduled for{" "}
                    <span className="font-semibold text-foreground">
                      {formatAppointmentDate(appointmentToCancel.date)} at{" "}
                      {formatAppointmentTime(appointmentToCancel.time)}
                    </span>{" "}
                    for patient{" "}
                    <span className="font-semibold text-foreground">
                      {appointmentToCancel.patientName || "Unknown Patient"}
                    </span>
                    ?
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Patient:</span>
                      <span className="font-medium">
                        {appointmentToCancel.patientName || "Unknown Patient"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {formatAppointmentDate(appointmentToCancel.date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {formatAppointmentTime(appointmentToCancel.time)}
                      </span>
                    </div>
                    {appointmentToCancel.type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{appointmentToCancel.type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCancelDialogOpen(false);
                setAppointmentToCancel(null);
              }}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Cancel Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
