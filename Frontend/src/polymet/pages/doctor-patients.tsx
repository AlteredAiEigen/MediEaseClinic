import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AddPatientDialog } from "@/polymet/components/add-patient-dialog";
import { NewAppointmentDialog } from "@/polymet/components/new-appointment-dialog";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { MediEaseLoader } from "@/polymet/components/mediease-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  FilterIcon,
  UserPlusIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  FileTextIcon,
  UserIcon,
  ActivityIcon,
  AlertCircleIcon,
} from "lucide-react";
import { get } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

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

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
  presentInClinic: boolean;
  chiefComplaint?: string | null;
  createdAt?: string;
  registeredAt?: string;
}

type PatientStatus = "in-clinic" | "remote";

interface Appointment {
  _id?: string;
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  date?: string;
  time?: string;
  type?: string;
  status?: string;
}

interface DoctorStats {
  totalPatients?: number;
  todayAppointments?: number;
  scheduledToday?: number;
  completedToday?: number;
  inQueue?: number;
  thisWeek?: number;
}

const extractList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data as T[];
  }
  if (payload && Array.isArray(payload.items)) {
    return payload.items as T[];
  }
  if (payload && Array.isArray(payload.results)) {
    return payload.results as T[];
  }
  if (payload && Array.isArray(payload.patients)) {
    return payload.patients as T[];
  }
  if (payload && Array.isArray(payload.appointments)) {
    return payload.appointments as T[];
  }
  return [];
};

const normalizeDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const PATIENTS_CACHE_TTL = 60_000; // 1 minute cache to keep tab snappy

const startOfMonth = (reference: Date) => {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endOfMonth = (reference: Date) => {
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
};

const endOfDay = (reference: Date) => {
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isWithinRange = (target: Date, start: Date, end: Date) =>
  target >= start && target <= end;

export function DoctorPatients() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms debounce
  const [statusFilter, setStatusFilter] = useState("all");
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [scheduleAppointmentOpen, setScheduleAppointmentOpen] = useState(false);
  const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const latestPatientsStateRef = useRef({
    patients: [] as Patient[],
    appointments: [] as Appointment[],
    doctorStats: null as DoctorStats | null,
  });

  useEffect(() => {
    latestPatientsStateRef.current = { patients, appointments, doctorStats };
  }, [patients, appointments, doctorStats]);

  const patientsCacheKey = useMemo(
    () => (user?._id ? `doctorPatientsCache:${user._id}` : null),
    [user?._id]
  );

  const todayRef = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => startOfMonth(todayRef), [todayRef]);
  const monthEnd = useMemo(() => endOfMonth(todayRef), [todayRef]);
  const followUpWindowEnd = useMemo(() => {
    const windowEnd = new Date(todayRef);
    windowEnd.setDate(windowEnd.getDate() + 7);
    return endOfDay(windowEnd);
  }, [todayRef]);
  const activeAppointmentStatuses = useMemo(
    () => new Set(["scheduled", "checked-in", "in-progress"]),
    []
  );

  const fetchPatients = useCallback(
    async (showLoading = true) => {
      if (!user?._id) {
        if (showLoading) {
          setIsLoading(false);
        }
        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setError(null);

        const doctorPatientsRequest = get(`/api/doctors/me/patients?limit=100`);
        const statsRequest = get("/api/doctors/me/stats");
        const appointmentsRequest = get(
          `/api/appointments?limit=100${user?._id ? `&doctor_id=${user._id}` : ""}`
        );

        const [patientsResponse, statsResponse, appointmentsResponse] = await Promise.all([
          doctorPatientsRequest,
          statsRequest,
          appointmentsRequest,
        ]);

        let patientList: Patient[] = [];

        if (patientsResponse.success) {
          patientList = extractList<Patient>(patientsResponse.data);
        }

        if (patientList.length === 0) {
          console.warn("Doctor patients endpoint returned no patients, trying fallback...");
          const fallbackResponse = await get(`/api/patients?limit=100`);
          if (fallbackResponse.success) {
            patientList = extractList<Patient>(fallbackResponse.data);
          }
        }

        const normalized = patientList.map((patient: any) => {
          const fullName =
            (patient.fullName || "").trim() ||
            [patient.firstName || "", patient.lastName || ""].filter(Boolean).join(" ").trim() ||
            patient.patientId ||
            "Unnamed Patient";

          return {
            _id: patient._id || patient.id,
            patientId: patient.patientId || "",
            fullName,
            firstName: patient.firstName || "",
            lastName: patient.lastName || "",
            age: patient.age || "",
            gender: patient.gender || "",
            phone: patient.phone || "",
            email: patient.email || "",
            presentInClinic: Boolean(patient.presentInClinic),
            chiefComplaint: patient.chiefComplaint || null,
            createdAt: patient.createdAt,
            registeredAt: patient.registeredAt,
          } as Patient;
        });

        setPatients(normalized);

        const resolvedDoctorStats = statsResponse.success
          ? ((statsResponse.data as DoctorStats) ?? null)
          : latestPatientsStateRef.current.doctorStats;
        setDoctorStats(resolvedDoctorStats);

        const resolvedAppointments = appointmentsResponse.success
          ? extractList<Appointment>(appointmentsResponse.data)
          : latestPatientsStateRef.current.appointments;
        setAppointments(resolvedAppointments);

        if (patientsCacheKey) {
          sessionStorage.setItem(
            patientsCacheKey,
            JSON.stringify({
              patients: normalized,
              doctorStats: resolvedDoctorStats,
              appointments: resolvedAppointments,
              cachedAt: Date.now(),
            })
          );
        }

        if (normalized.length === 0) {
          setError(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load patients";
        if (message.includes("No patients") || message.includes("not found")) {
          setPatients([]);
          setError(null);
        } else {
          setError(message);
        }
        setDoctorStats(latestPatientsStateRef.current.doctorStats);
        setAppointments(latestPatientsStateRef.current.appointments);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [user?._id, patientsCacheKey]
  );

  useEffect(() => {
    if (!user?._id || !patientsCacheKey) {
      return;
    }

    let usedCache = false;

    try {
      const cachedRaw = sessionStorage.getItem(patientsCacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as {
          patients?: Patient[];
          doctorStats?: DoctorStats | null;
          appointments?: Appointment[];
          cachedAt?: number;
        };

        if (!cached.cachedAt || Date.now() - cached.cachedAt <= PATIENTS_CACHE_TTL) {
          if (cached.patients) {
            setPatients(cached.patients);
          }
          if (typeof cached.doctorStats !== "undefined") {
            setDoctorStats(cached.doctorStats ?? null);
          }
          if (cached.appointments) {
            setAppointments(cached.appointments);
          }
          setIsLoading(false);
          usedCache = true;
        } else {
          sessionStorage.removeItem(patientsCacheKey);
        }
      }
    } catch (err) {
      console.warn("Failed to load cached patient data", err);
    }

    fetchPatients(!usedCache);
  }, [user?._id, patientsCacheKey, fetchPatients]);

  const totalPatientsCount = useMemo(() => {
    // Always use the actual patients array length to ensure it updates when new patients are added
    return patients.length;
  }, [patients.length]);

  const inClinicCount = useMemo(
    () => patients.filter((patient) => patient.presentInClinic).length,
    [patients]
  );

  const newPatientsThisMonth = useMemo(() => {
    return patients.filter((patient) => {
      const created =
        normalizeDate(patient.createdAt) ?? normalizeDate(patient.registeredAt);
      if (!created) return false;
      return isWithinRange(created, monthStart, monthEnd);
    }).length;
  }, [patients, monthStart, monthEnd]);

  const followUpsDue = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = normalizeDate(appointment.date);
      if (!appointmentDate) return false;
      if (appointmentDate < todayRef || appointmentDate > followUpWindowEnd) {
        return false;
      }
      if (appointment.type && !appointment.type.toLowerCase().includes("follow")) {
        return false;
      }
      if (appointment.status && !activeAppointmentStatuses.has(appointment.status)) {
        return false;
      }
      if (user?._id && appointment.doctorId && appointment.doctorId !== user._id) {
        return false;
      }
      return true;
    }).length;
  }, [appointments, todayRef, followUpWindowEnd, activeAppointmentStatuses, user?._id]);

  const filteredPatients = useMemo(() => {
    // Return empty if no patients
    if (!patients || patients.length === 0) {
      return [];
    }
    
    const query = (debouncedSearchQuery || "").trim().toLowerCase();
    
    return patients.filter((patient) => {
      // Normalize patient data for search - ensure all fields are strings
      const fullName = String(patient.fullName || "").trim().toLowerCase();
      const firstName = String(patient.firstName || "").trim().toLowerCase();
      const lastName = String(patient.lastName || "").trim().toLowerCase();
      const patientId = String(patient.patientId || "").trim().toLowerCase();
      const email = String(patient.email || "").trim().toLowerCase();
      const phone = String(patient.phone || "").trim().toLowerCase();
      
      // Search across all fields - if query is empty, show all
      let matchesSearch = true;
      if (query.length > 0) {
        matchesSearch =
          fullName.includes(query) ||
          firstName.includes(query) ||
          lastName.includes(query) ||
          patientId.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          `${firstName} ${lastName}`.trim().includes(query);
      }
      
      // Status filtering
      let matchesStatus = true;
      if (statusFilter === "in-clinic") {
        matchesStatus = Boolean(patient.presentInClinic);
      } else if (statusFilter === "remote") {
        matchesStatus = !Boolean(patient.presentInClinic);
      } else if (statusFilter === "scheduled") {
        // Check if patient has any scheduled appointments
        const hasScheduledAppointment = appointments.some(
          (apt) => {
            const aptPatientId = String(apt.patientId || "");
            return (
              (aptPatientId === String(patient._id || "")) ||
              (aptPatientId === String(patient.patientId || ""))
            ) && apt.status === "scheduled";
          }
        );
        matchesStatus = hasScheduledAppointment;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [patients, debouncedSearchQuery, statusFilter, appointments]);

  const getStatusText = (patient: Patient): string | null => {
    // Only show status if patient has appointments
    const hasAppointments = appointments.some(
      (apt) =>
        apt.patientId === patient._id || apt.patientId === patient.patientId
    );
    
    if (!hasAppointments) {
      return null; // No status if no appointments
    }
    
    return patient.presentInClinic ? "in-clinic" : "remote";
  };

  if (isLoading) {
    return (
      <MediEaseLoader
        message="Preparing your patient roster…"
        subtext="Syncing records, follow-ups, and upcoming appointments"
        minHeight="min-h-[500px]"
      />
    );
  }

  if (error && patients.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load patients</h3>
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
      {/* Add Patient Dialog */}
      <AddPatientDialog
        open={addPatientOpen}
        onOpenChange={setAddPatientOpen}
        onPatientAdded={() => fetchPatients(false)}
      />

      {/* Schedule Appointment Dialog */}
      <NewAppointmentDialog
        open={scheduleAppointmentOpen}
        onOpenChange={(open) => {
          setScheduleAppointmentOpen(open);
          if (!open) {
            setSelectedPatientForSchedule(null);
          }
        }}
      />

      {error && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {totalPatientsCount}
                </h3>
                {typeof doctorStats?.thisWeek === "number" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Appointments this week: {doctorStats.thisWeek}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Clinic Today
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {inClinicCount}
                </h3>
                {typeof doctorStats?.inQueue === "number" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    In queue: {doctorStats.inQueue}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ActivityIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New This Month
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{newPatientsThisMonth}</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {monthStart.toLocaleDateString()} – {monthEnd.toLocaleDateString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <UserPlusIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Follow-ups Due
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{followUpsDue}</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Next 7 days
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md"
              onClick={() => setAddPatientOpen(true)}
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search patients by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger 
                className="w-full md:w-[200px] bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600"
              >
                <FilterIcon className="w-4 h-4 mr-2" />

                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  value="all"
                  className="focus:bg-teal-50 focus:text-teal-700 dark:focus:bg-teal-950/20 dark:focus:text-teal-300"
                >
                  All Status
                </SelectItem>
                <SelectItem 
                  value="in-clinic"
                  className="focus:bg-teal-50 focus:text-teal-700 dark:focus:bg-teal-950/20 dark:focus:text-teal-300"
                >
                  In Clinic
                </SelectItem>
                <SelectItem 
                  value="remote"
                  className="focus:bg-teal-50 focus:text-teal-700 dark:focus:bg-teal-950/20 dark:focus:text-teal-300"
                >
                  Remote Follow-up
                </SelectItem>
                <SelectItem 
                  value="scheduled"
                  className="focus:bg-teal-50 focus:text-teal-700 dark:focus:bg-teal-950/20 dark:focus:text-teal-300"
                >
                  Scheduled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>All Patients ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No patients found</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient._id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-all duration-200 bg-card"
                >
                  <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-semibold">
                      {patient.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">
                        {patient.fullName}
                      </h4>
                      {getStatusText(patient) && (
                        <Badge 
                          className="text-white border-0"
                          style={{
                            background: "linear-gradient(to right, rgb(20, 184, 166), rgb(16, 185, 129))"
                          }}
                        >
                          {getStatusText(patient)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{patient.patientId}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        {patient.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MailIcon className="w-3 h-3" />
                        {patient.email || "Not provided"}
                      </span>
                    </div>
                    {patient.chiefComplaint && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Chief complaint: {patient.chiefComplaint}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/patient-overview/${patient._id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                      >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      onClick={() => {
                        setSelectedPatientForSchedule(patient);
                        setScheduleAppointmentOpen(true);
                      }}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
