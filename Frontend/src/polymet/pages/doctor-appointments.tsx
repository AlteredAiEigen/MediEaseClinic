import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { NewAppointmentDialog } from "@/polymet/components/new-appointment-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  FilterIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { get, put, patch } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useDoctorQueueWebSocket } from "@/hooks/use-websocket";
import { MediEaseLoader } from "@/polymet/components/mediease-loader";

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

// Helper function to format date in YYYY-MM-DD using local timezone (not UTC)
// This prevents timezone shifts that cause dates to appear one day off
// Using toISOString() converts to UTC which can shift the date by one day
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get ISO week number (1–53) for a given date
const getISOWeekNumber = (date: Date): number => {
  // Copy date so we don't mutate the original
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO week starts on Monday (1) and ends on Sunday (7)
  const dayNumber = tmp.getUTCDay() || 7;
  // Set to the Thursday of this week to ensure week belongs to the correct year
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const diffInDays = Math.floor((tmp.getTime() - yearStart.getTime()) / 86400000) + 1;
  return Math.ceil(diffInDays / 7);
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

export function DoctorAppointments() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
  const currentWeekNumber = useMemo(() => getISOWeekNumber(new Date()), []);

  // WebSocket for real-time appointment updates
  const { lastMessage, isConnected } = useDoctorQueueWebSocket(user?._id || "");

  // Fetch appointments on component mount and when date changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?._id) return;
      
      try {
        setIsLoading(true);
        // Use local timezone formatting instead of UTC to avoid date shift
        const selectedDate = date ? formatDateLocal(date) : formatDateLocal(new Date());
        const url = `/api/appointments?doctorId=${user._id}&date=${selectedDate}&limit=100`;
        const response = await get(url);
        if (response.success) {
          const rawAppointments = extractList<any>(response.data);
          const mappedAppointments = rawAppointments.map((apt: any) => ({
            ...apt,
            id: apt._id || apt.appointmentId,
            avatar: apt.patientName
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=random`
              : undefined,
            reason: apt.reason || "General Consultation",
            type: apt.type || (apt.doctorId ? "Doctor Appointment" : "Lab Test"),
          }));
          setAppointments(mappedAppointments);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user, date]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    const handleAppointmentUpdate = async () => {
      try {
        if (lastMessage.type === 'appointment_status_updated') {
          // Refresh appointment data silently (no loading state)
          // Use local timezone formatting to avoid date shift
          const selectedDate = date ? formatDateLocal(date) : formatDateLocal(new Date());
          const url = `/api/appointments?doctorId=${user._id}&date=${selectedDate}&limit=100`;
          const response = await get(url);
          if (response.success) {
            const rawAppointments = extractList<any>(response.data);
            const mappedAppointments = rawAppointments.map((apt: any) => ({
              ...apt,
              id: apt._id || apt.appointmentId,
              avatar: apt.patientName
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=random`
                : undefined,
              reason: apt.reason || "General Consultation",
              type: apt.type || (apt.doctorId ? "Doctor Appointment" : "Lab Test"),
            }));
            setAppointments(mappedAppointments);
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    handleAppointmentUpdate();
  }, [lastMessage, user, date]);

  const selectedDateStr = useMemo(
    () => (date ? formatDateLocal(date) : formatDateLocal(new Date())),
    [date]
  );

  const dateAppointments = useMemo(
    () => appointments.filter((apt) => apt.date === selectedDateStr),
    [appointments, selectedDateStr]
  );

  const filteredAppointments = useMemo(
    () =>
      statusFilter === "all"
        ? dateAppointments
        : dateAppointments.filter((apt) => apt.status === statusFilter),
    [dateAppointments, statusFilter]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "checked-in":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "ongoing":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      case "checkout":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "completed":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "no-show":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    if (type?.toLowerCase().includes("lab test")) {
      return "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400";
    }
    switch (type?.toLowerCase()) {
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

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      const response = await patch<{ appointment: any }>(
        `/api/appointments/${appointmentToCancel._id || appointmentToCancel.id}/status`,
        { status: "cancelled" }
      );
      if (response.success && response.data?.appointment) {
        setCancelDialogOpen(false);
        setAppointmentToCancel(null);
        // Refresh appointments
        const selectedDate = date ? formatDateLocal(date) : formatDateLocal(new Date());
        const url = `/api/appointments?doctorId=${user?._id}&date=${selectedDate}&limit=100`;
        const refreshResponse = await get(url);
        if (refreshResponse.success) {
          const rawAppointments = extractList<any>(refreshResponse.data);
          const mappedAppointments = rawAppointments.map((apt: any) => ({
            ...apt,
            id: apt._id || apt.appointmentId,
            avatar: apt.patientName
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=random`
              : undefined,
            reason: apt.reason || "General Consultation",
            type: apt.type || (apt.doctorId ? "Doctor Appointment" : "Lab Test"),
          }));
          setAppointments(mappedAppointments);
        }
      } else {
        console.error("Failed to cancel appointment:", response.message);
      }
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
    }
  };


  // Handle viewing appointment details - opens patient overview with appointment details
  const handleViewDetails = (appointment: any) => {
    // Navigate to patient overview page with the patient ID
    const patientId = appointment.patientId;
    if (patientId) {
      window.location.href = `/patient-overview/${patientId}`;
    }
  };

  // Refresh appointments after edit
  const refreshAppointments = async () => {
    const selectedDate = date ? formatDateLocal(date) : formatDateLocal(new Date());
    const url = `/api/appointments?doctorId=${user?._id}&date=${selectedDate}&limit=100`;
    const response = await get(url);
    if (response.success) {
      const rawAppointments = extractList<any>(response.data);
      const mappedAppointments = rawAppointments.map((apt: any) => ({
        ...apt,
        id: apt._id || apt.appointmentId,
        avatar: apt.patientName
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=random`
          : undefined,
        reason: apt.reason || "General Consultation",
        type: apt.type || (apt.doctorId ? "Doctor Appointment" : "Lab Test"),
      }));
      setAppointments(mappedAppointments);
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

  const formatAppointmentTime = (time?: string) => {
    if (!time) return "-- --";

    const trimmed = time.trim();
    if (/am|pm/i.test(trimmed)) {
      const [timePart, period] = trimmed.split(/\s+/);
      return `${timePart ?? trimmed}${period ? ` ${period.toUpperCase()}` : ""}`.trim();
    }

    const [rawHours, rawMinutes = "00"] = trimmed.split(":" );
    const hoursNum = Number(rawHours);

    if (Number.isNaN(hoursNum)) return trimmed;

    const period = hoursNum >= 12 ? "PM" : "AM";
    const normalizedHours = hoursNum % 12 || 12;
    const hoursText = normalizedHours.toString().padStart(2, "0");
    const minutesText = rawMinutes.padStart(2, "0");

    return `${hoursText}:${minutesText} ${period}`;
  };

  if (isLoading) {
    return (
      <MediEaseLoader>
        {/* Render the appointments page skeleton/layout while loading */}
        <div className="space-y-6">
          {/* Stats Section Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-border shadow-sm hover:shadow-md transition-shadow rounded-lg p-6 bg-card">
                <div className="animate-pulse space-y-4">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-16 h-4 bg-muted rounded" />
                    <div className="w-12 h-6 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar Skeleton */}
            <div className="border-border shadow-md rounded-lg">
              <div className="border-b p-4">
                <div className="animate-pulse">
                  <div className="w-16 h-4 bg-muted rounded" />
                </div>
              </div>
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  <div className="w-full h-64 bg-muted rounded" />
                  <div className="w-full h-8 bg-muted rounded" />
                </div>
              </div>
            </div>

            {/* Appointments List Skeleton */}
            <div className="lg:col-span-2 border-border shadow-md rounded-lg">
              <div className="border-b p-4">
                <div className="animate-pulse">
                  <div className="w-48 h-4 bg-muted rounded" />
                </div>
              </div>
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg border">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-4 bg-muted rounded" />
                      <div className="w-24 h-3 bg-muted rounded" />
                      <div className="flex gap-2">
                        <div className="w-16 h-6 bg-muted rounded" />
                        <div className="w-20 h-6 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-20 h-8 bg-muted rounded" />
                      <div className="w-16 h-8 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MediEaseLoader>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={newAppointmentOpen}
        onOpenChange={(open) => {
          setNewAppointmentOpen(open);
          if (!open) {
            setEditingAppointment(null);
          }
        }}
        editingAppointment={editingAppointment}
        onAppointmentUpdated={() => {
          // Refresh appointments
          const selectedDate = date ? formatDateLocal(date) : formatDateLocal(new Date());
          const url = `/api/appointments?doctorId=${user?._id}&date=${selectedDate}&limit=100`;
          get(url).then((response) => {
            if (response.success) {
              const rawAppointments = extractList<any>(response.data);
              const mappedAppointments = rawAppointments.map((apt: any) => ({
                ...apt,
                id: apt._id || apt.appointmentId,
                avatar: apt.patientName
                  ? `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=random`
                  : undefined,
                reason: apt.reason || "General Consultation",
                type: apt.type || (apt.doctorId ? "Doctor Appointment" : "Lab Test"),
              }));
              setAppointments(mappedAppointments);
            }
          });
        }}
      />

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Total
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {filteredAppointments.length}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <TrendingUpIcon className="w-3 h-3" />
                  +8% vs yesterday
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
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
                    dateAppointments.filter((a) => a.status === "completed")
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
                    dateAppointments.filter((a) => a.status === "scheduled")
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

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {currentWeekNumber}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
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
                <Button
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md"
                  onClick={() => setNewAppointmentOpen(true)}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-all duration-200 bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {appointment.patientName}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            ID: {appointment.appointmentId}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getTypeColor(appointment.type)}>
                              {appointment.type}
                            </Badge>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          {(appointment.reason || appointment.notes) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {appointment.reason || appointment.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatAppointmentTime(appointment.time)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isPastAppointment(appointment.date) && appointment.status !== "cancelled" && appointment.status !== "completed" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAppointment(appointment);
                              setNewAppointmentOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setAppointmentToCancel(appointment);
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
