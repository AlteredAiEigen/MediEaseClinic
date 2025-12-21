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
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
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
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce for better performance
  const [statusFilter, setStatusFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [dateOfBirthFilter, setDateOfBirthFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const debouncedAddressFilter = useDebounce(addressFilter, 300);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Helper function to check if phone number is complete (10 digits minimum)
  const isPhoneComplete = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    // Remove +91 prefix if present
    const normalized = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
    return normalized.length >= 10;
  };
  
  // Helper function to check if date of birth is complete (YYYY-MM-DD format)
  const isDateOfBirthComplete = (dob: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dob.trim());
  };
  
  // Helper function to check if email is complete/valid
  const isEmailComplete = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    // Basic email validation: must contain @ and a dot after @
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };
  
  // Only use phone filter if it's complete (10+ digits)
  const effectivePhoneFilter = isPhoneComplete(phoneFilter) ? phoneFilter : "";
  const debouncedPhoneFilter = useDebounce(effectivePhoneFilter, 500);
  
  // Only use date of birth filter if it's complete (YYYY-MM-DD format)
  const effectiveDateOfBirthFilter = isDateOfBirthComplete(dateOfBirthFilter) ? dateOfBirthFilter : "";
  const debouncedDateOfBirthFilter = useDebounce(effectiveDateOfBirthFilter, 500);
  
  // Only use email filter if it's complete/valid
  const effectiveEmailFilter = isEmailComplete(emailFilter) ? emailFilter.trim() : "";
  const debouncedEmailFilter = useDebounce(effectiveEmailFilter, 500);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [scheduleAppointmentOpen, setScheduleAppointmentOpen] = useState(false);
  const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPatients, setTotalPatients] = useState(0);

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
    async (targetPage = page, showLoading = true) => {
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

        const searchQueryParam = debouncedSearchQuery
          ? `&search=${encodeURIComponent(debouncedSearchQuery)}`
          : "";
        
        // Build additional filter params
        const filterParams = [];
        if (debouncedPhoneFilter) {
          filterParams.push(`phone=${encodeURIComponent(debouncedPhoneFilter)}`);
        }
        if (debouncedDateOfBirthFilter) {
          filterParams.push(`date_of_birth=${encodeURIComponent(debouncedDateOfBirthFilter)}`);
        }
        if (debouncedAddressFilter) {
          filterParams.push(`address=${encodeURIComponent(debouncedAddressFilter)}`);
        }
        if (debouncedEmailFilter) {
          filterParams.push(`email=${encodeURIComponent(debouncedEmailFilter)}`);
        }
        const additionalFilters = filterParams.length > 0 ? `&${filterParams.join('&')}` : '';
        
        const doctorPatientsRequest = get(
          `/api/doctors/me/patients?limit=${pageSize}&page=${targetPage}${searchQueryParam}${additionalFilters}`
        );
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
        let totalFromApi: number | undefined;

        if (patientsResponse.success) {
          patientList = extractList<Patient>(patientsResponse.data);
          const totalRaw = (patientsResponse.data as any)?.total ?? (patientsResponse.data as any)?.pagination?.total;
          if (Number.isFinite(Number(totalRaw))) {
            totalFromApi = Number(totalRaw);
          }
        }

        if (patientList.length === 0) {
          console.warn("Doctor patients endpoint returned no patients, trying fallback...");
          const fallbackResponse = await get(`/api/patients?limit=${pageSize}&page=${targetPage}${searchQueryParam}${additionalFilters}`);
          if (fallbackResponse.success) {
            patientList = extractList<Patient>(fallbackResponse.data);
            const totalRaw = (fallbackResponse.data as any)?.total ?? (fallbackResponse.data as any)?.pagination?.total;
            if (Number.isFinite(Number(totalRaw))) {
              totalFromApi = Number(totalRaw);
            }
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

        // Client-side filter to make search reliable even if backend search param is ignored
        const filtered = (() => {
          if (!debouncedSearchQuery.trim()) return normalized;
          const q = debouncedSearchQuery.toLowerCase();
          return normalized.filter((p) => {
            return (
              p.fullName.toLowerCase().includes(q) ||
              (p.patientId || "").toLowerCase().includes(q) ||
              (p.phone || "").toLowerCase().includes(q) ||
              (p.email || "").toLowerCase().includes(q) ||
              (p.chiefComplaint || "").toLowerCase().includes(q)
            );
          });
        })();

        // When searching, reflect filtered count; otherwise use API total if provided
        setTotalPatients(
          debouncedSearchQuery.trim()
            ? filtered.length
            : totalFromApi ??
              (patientsResponse.success
                ? patientList.length + (Math.max(0, targetPage - 1) * pageSize)
                : patientList.length)
        );
        setPage(targetPage);
        setPatients(filtered);

        const resolvedDoctorStats = statsResponse.success
          ? ((statsResponse.data as DoctorStats) ?? null)
          : latestPatientsStateRef.current.doctorStats;
        setDoctorStats(resolvedDoctorStats);

        const resolvedAppointments = appointmentsResponse.success
          ? extractList<Appointment>(appointmentsResponse.data)
          : latestPatientsStateRef.current.appointments;
        setAppointments(resolvedAppointments);

        if (patientsCacheKey && targetPage === 1 && !debouncedSearchQuery) {
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
    [user?._id, patientsCacheKey, debouncedSearchQuery, page, pageSize, debouncedPhoneFilter, debouncedDateOfBirthFilter, debouncedAddressFilter, debouncedEmailFilter]
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

    fetchPatients(1, !usedCache);
  }, [user?._id, patientsCacheKey, fetchPatients]);

  useEffect(() => {
    setPage(1);
    fetchPatients(1, true);
  }, [debouncedSearchQuery, fetchPatients]);

  const totalPatientsCount = useMemo(() => {
    return totalPatients || patients.length;
  }, [totalPatients, patients.length]);

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
      <MediEaseLoader>
        {/* Render the patients page skeleton/layout while loading */}
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

          {/* Search and Filters Skeleton */}
          <div className="border-border shadow-md rounded-lg p-6 bg-card">
            <div className="animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-32 h-10 bg-muted rounded" />
                <div className="flex-1 h-10 bg-muted rounded" />
                <div className="w-40 h-10 bg-muted rounded" />
              </div>
            </div>
          </div>

          {/* Patients List Skeleton */}
          <div className="border-border shadow-md rounded-lg bg-card">
            <div className="border-b p-4">
              <div className="animate-pulse">
                <div className="w-32 h-4 bg-muted rounded" />
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-14 h-14 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="w-40 h-4 bg-muted rounded" />
                    <div className="w-24 h-3 bg-muted rounded" />
                    <div className="flex gap-4">
                      <div className="w-20 h-3 bg-muted rounded" />
                      <div className="w-24 h-3 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-24 h-8 bg-muted rounded" />
                    <div className="w-20 h-8 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MediEaseLoader>
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
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="whitespace-nowrap"
            >
              {showAdvancedFilters ? (
                <>
                  <ChevronUpIcon className="w-4 h-4 mr-2" />
                  Hide Filters
                </>
              ) : (
                <>
                  <FilterIcon className="w-4 h-4 mr-2" />
                  More Filters
                </>
              )}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone-filter">Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone-filter"
                    placeholder="Enter full 10-digit number (e.g., 9876543210)"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    className="pl-10"
                    maxLength={15}
                  />
                  {phoneFilter && (
                    <button
                      onClick={() => setPhoneFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  {phoneFilter && !isPhoneComplete(phoneFilter) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter at least 10 digits to search
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dob-filter">Date of Birth</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    id="dob-filter"
                    type="date"
                    value={dateOfBirthFilter}
                    onChange={(e) => setDateOfBirthFilter(e.target.value)}
                    className="pl-10"
                  />
                  {dateOfBirthFilter && (
                    <button
                      onClick={() => setDateOfBirthFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  {dateOfBirthFilter && !isDateOfBirthComplete(dateOfBirthFilter) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please select a complete date
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address-filter">Address</Label>
                <div className="relative">
                  <Input
                    id="address-filter"
                    placeholder="Enter address..."
                    value={addressFilter}
                    onChange={(e) => setAddressFilter(e.target.value)}
                  />
                  {addressFilter && (
                    <button
                      onClick={() => setAddressFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-filter">Email Address</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    id="email-filter"
                    type="email"
                    placeholder="Enter complete email (e.g., user@example.com)"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="pl-10"
                  />
                  {emailFilter && (
                    <button
                      onClick={() => setEmailFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  {emailFilter && !isEmailComplete(emailFilter) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a complete email address to search
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
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
                        disabled
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
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {Math.max(1, Math.ceil(totalPatientsCount / pageSize))} • {totalPatientsCount} total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => fetchPatients(Math.max(1, page - 1), true)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(totalPatientsCount / pageSize) || isLoading}
                onClick={() => fetchPatients(page + 1, true)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
