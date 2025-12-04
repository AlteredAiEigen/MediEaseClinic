import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  FilterIcon,
} from "lucide-react";
import { get, post, put, patch } from "@/lib/api-client";
import type { BillingItem } from "@/polymet/pages/admin-billing";

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
  speciality?: string;
}

// Helper function to format date in YYYY-MM-DD using local timezone (not UTC)
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

export function AdminAppointments() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addAppointmentDialogOpen, setAddAppointmentDialogOpen] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    bookingKind: "doctor" as "doctor" | "lab-test",
    type: "consultation",
    reason: "",
    notes: "",
  });

  const sortAppointments = (items: Appointment[]) =>
    [...items].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

  // Fetch all appointments for stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch patients, doctors and billing items for dropdowns
        const [patientsResponse, doctorsResponse, billingResponse] = await Promise.all([
          get<Patient[]>("/api/patients?limit=100"),
          get<Doctor[]>("/api/doctors?limit=50"),
          get<{ items: BillingItem[] }>("/api/admin/billing-items"),
        ]);

        if (patientsResponse.success && Array.isArray(patientsResponse.data)) {
          setPatients(
            [...patientsResponse.data].sort((a, b) =>
              a.fullName.localeCompare(b.fullName)
            )
          );
        }

        if (doctorsResponse.success && Array.isArray(doctorsResponse.data)) {
          setDoctors(
            [...doctorsResponse.data].sort((a, b) =>
              `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
            )
          );
        }

        if (billingResponse.success && Array.isArray(billingResponse.data?.items)) {
          setBillingItems(billingResponse.data.items);
        }

      } catch (err) {
        console.error("Error loading data:", err);
        // Don't show error for initial load - just log it
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived billing-based options
  const appointmentPricingItems = useMemo(
    () => billingItems.filter((item) => item.category === "appointmentType" && item.isActive),
    [billingItems]
  );

  const labTestPricingItems = useMemo(
    () => billingItems.filter((item) => item.category === "test" && item.isActive),
    [billingItems]
  );

  // Fetch appointments for selected date
  useEffect(() => {
    const fetchDateAppointments = async () => {
      if (!date) return;
      
      try {
        const selectedDate = formatDateLocal(date);
        const response = await get<Appointment[]>(`/api/appointments?date=${selectedDate}&limit=100`);
        if (response.success) {
          const rawAppointments = extractList<Appointment>(response.data).map((apt) => {
            // For compatibility with older data that may not have `type`,
            // infer a simple type label from doctor presence.
            if (apt.type) {
              return apt;
            }
            return {
              ...apt,
              type: apt.doctorId ? "Doctor Appointment" : "Lab Test",
            };
          });
          // Update appointments list with date-filtered appointments
          // We'll merge with existing list but prioritize date-filtered ones
          setAppointmentsList((prev) => {
            const otherDates = prev.filter((apt) => apt.date !== selectedDate);
            return sortAppointments([...otherDates, ...rawAppointments]);
          });
        }
      } catch (err) {
        console.error('Failed to fetch date appointments:', err);
      }
    };

    fetchDateAppointments();
  }, [date]);

  const selectedDateStr = useMemo(
    () => (date ? formatDateLocal(date) : formatDateLocal(new Date())),
    [date]
  );

  // Filter appointments by selected date
  const dateAppointments = useMemo(
    () => appointmentsList.filter((apt) => apt.date === selectedDateStr),
    [appointmentsList, selectedDateStr]
  );

  // Filter appointments by search and status
  const filteredAppointments = useMemo(
    () => {
      let filtered = dateAppointments;
      
      // Apply search filter
      if (searchQuery.trim().length > 0) {
        filtered = filtered.filter((appointment) =>
          appointment.appointmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appointment.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appointment.doctorName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply status filter
      if (filterStatus !== "all") {
        filtered = filtered.filter((appointment) => appointment.status === filterStatus);
      }
      
      return filtered;
    },
    [dateAppointments, searchQuery, filterStatus]
  );

  const handleAddOrUpdateAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) {
      setError("Please fill in all required fields");
      return;
    }

    if (newAppointment.bookingKind === "doctor" && !newAppointment.doctorId) {
      setError("Please select a doctor for this appointment");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        patientId: newAppointment.patientId,
        date: newAppointment.date,
        time: newAppointment.time,
        type: newAppointment.type,
        // Derive a meaningful reason from billing configuration
        reason:
          newAppointment.bookingKind === "doctor"
            ? appointmentPricingItems.find((i) => i.key === newAppointment.type)?.label ||
              "Doctor appointment"
            : labTestPricingItems.find((i) => i.key === newAppointment.type)?.label ||
              "Lab test appointment",
        notes: newAppointment.notes || "",
      };

      // Only send doctorId when booking a doctor appointment
      if (newAppointment.bookingKind === "doctor" && newAppointment.doctorId) {
        payload.doctorId = newAppointment.doctorId;
      }

      // Send booking kind so backend can distinguish doctor vs lab-test
      payload.bookingKind = newAppointment.bookingKind;

      let response;
      if (editingAppointment) {
        // Update existing appointment
        response = await put<{ appointment: Appointment }>(
          `/api/appointments/${editingAppointment._id}`,
          payload
        );
      } else {
        // Create new appointment
        response = await post<{ appointment: Appointment }>("/api/appointments", payload);
      }

      if (response.success && response.data?.appointment) {
        setError(null);
        setAppointmentsList((prev) => {
          const updated = response.data!.appointment;
          if (editingAppointment) {
            return sortAppointments(prev.map((apt) => (apt._id === updated._id ? updated : apt)));
          }
          return sortAppointments([...prev, updated]);
        });
        setAddAppointmentDialogOpen(false);
        setEditingAppointment(null);
        setNewAppointment({
          patientId: "",
          doctorId: "",
          date: "",
          time: "",
          bookingKind: "doctor",
          type: "consultation",
          reason: "",
          notes: "",
        });
      } else {
        setError(response.message ?? "Failed to create appointment");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create appointment";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
      case "checked-in":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400";
      case "ongoing":
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400";
      case "follow-up":
        return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400";
      case "checkup":
        return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400";
      case "emergency":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400";
    }
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

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      const res = await patch<{ appointment: Appointment }>(
        `/api/appointments/${appointmentToCancel._id}/status`,
        { status: "cancelled" }
      );
      if (res.success && res.data?.appointment) {
        const updated = res.data.appointment;
        setAppointmentsList((prev) =>
          sortAppointments(
            prev.map((apt) => (apt._id === updated._id ? updated : apt))
          )
        );
        setCancelDialogOpen(false);
        setAppointmentToCancel(null);
      } else {
        setError(res.message ?? "Failed to cancel appointment");
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-16 h-4 bg-muted rounded" />
                    <div className="w-12 h-6 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading appointments...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && appointmentsList.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load appointments</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Total Appointments
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mt-1">
                  {appointmentsList.length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <CalendarIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Scheduled
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mt-1">
                  {appointmentsList.filter((a) => a.status === "scheduled").length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Completed
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mt-1">
                  {appointmentsList.filter((a) => a.status === "completed").length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Cancelled
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mt-1">
                  {appointmentsList.filter((a) => a.status === "cancelled").length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                <XCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Calendar and Appointments */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-center w-full">
              <div className="w-full">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  className="rounded-md"
                />
              </div>
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
                  open={addAppointmentDialogOpen}
                  onOpenChange={setAddAppointmentDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Schedule New Appointment</DialogTitle>
                      <DialogDescription>
                        Create a new appointment for a patient
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Booking kind: doctor vs lab test */}
                      <div className="space-y-2">
                        <Label htmlFor="bookingKind">Booking For</Label>
                        <Select
                          value={newAppointment.bookingKind}
                          onValueChange={(value) =>
                            setNewAppointment({
                              ...newAppointment,
                              bookingKind: value as "doctor" | "lab-test",
                              // Clear doctor if switching to lab-test
                              doctorId: value === "lab-test" ? "" : newAppointment.doctorId,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select booking type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="doctor">Doctor Appointment</SelectItem>
                            <SelectItem value="lab-test">Lab Test Appointment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Patient */}
                      <div className="space-y-2">
                        <Label htmlFor="patient">Patient</Label>
                        <Select
                          value={newAppointment.patientId}
                          onValueChange={(value) =>
                            setNewAppointment({ ...newAppointment, patientId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient._id} value={patient._id}>
                                {patient.fullName} ({patient.patientId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Doctor selection (only for doctor appointments) */}
                      {newAppointment.bookingKind === "doctor" && (
                        <div className="space-y-2">
                          <Label htmlFor="doctor">Doctor</Label>
                          <Select
                            value={newAppointment.doctorId}
                            onValueChange={(value) =>
                              setNewAppointment({ ...newAppointment, doctorId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor._id} value={doctor._id}>
                                  {doctor.firstName} {doctor.lastName} - {doctor.speciality || "General Medicine"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newAppointment.date}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={newAppointment.time}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                time: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">
                          {newAppointment.bookingKind === "doctor"
                            ? "Appointment Type"
                            : "Lab Test Type"}
                        </Label>
                        <Select
                          value={newAppointment.type}
                          onValueChange={(value) =>
                            setNewAppointment({ ...newAppointment, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                newAppointment.bookingKind === "doctor"
                                  ? "Select appointment type"
                                  : "Select lab test"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {newAppointment.bookingKind === "doctor"
                              ? appointmentPricingItems.map((item) => (
                                  <SelectItem key={item._id} value={item.key}>
                                    {item.label}
                                  </SelectItem>
                                ))
                              : labTestPricingItems.map((item) => (
                                  <SelectItem key={item._id} value={item.key}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Add any notes"
                          value={newAppointment.notes}
                          onChange={(e) =>
                            setNewAppointment({
                              ...newAppointment,
                              notes: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddAppointmentDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddOrUpdateAppointment}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                      >
                        {isSubmitting
                          ? editingAppointment
                            ? "Updating..."
                            : "Scheduling..."
                          : editingAppointment
                          ? "Update Appointment"
                          : "Schedule Appointment"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <FilterIcon className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="checkout">Checkout</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, doctor, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments for this date</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Select a different date or create a new appointment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-all duration-200 bg-card"
                  >
                    <Avatar className="w-12 h-12 border-2 border-[#00C4B3]/20">
                      <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                        {(appointment.patientName || "U")
                          .split(" ")
                          .map((n) => n[0])
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
                            <Badge className={getTypeBadge(appointment.type)}>
                              {appointment.type}
                            </Badge>
                            <Badge className={getStatusBadge(appointment.status)}>
                              {appointment.status}
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
                            {formatAppointmentTime(appointment.time)}
                          </p>
                          {appointment.doctorId && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserIcon className="w-4 h-4" />
                              <span>{appointment.doctorName || "Unknown Doctor"}</span>
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
                                  setNewAppointment({
                                    patientId: appointment.patientId,
                                    doctorId: appointment.doctorId || "",
                                    date: appointment.date,
                                    time: appointment.time,
                                    bookingKind: appointment.doctorId ? "doctor" : "lab-test",
                                    type: appointment.type,
                                    reason: appointment.reason || "",
                                    notes: appointment.notes || "",
                                  });
                                  setAddAppointmentDialogOpen(true);
                                }}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
          <DialogFooter>
            <Button
              variant="outline"
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
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
