import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  UserPlusIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  FilterIcon,
  FileTextIcon,
  UserIcon,
  ActivityIcon,
  AlertCircleIcon,
} from "lucide-react";
import { get } from "@/lib/api-client";

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

const endOfDay = (reference: Date) => {
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isWithinRange = (target: Date, start: Date, end: Date) =>
  target >= start && target <= end;

const isSameDay = (target: Date, comparison: Date) =>
  target.toDateString() === comparison.toDateString();

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
  presentInClinic: boolean;
  chiefComplaint?: string | null;
  createdAt?: string;
  registeredAt?: string;
}

export function ReceptionistPatients() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce for better performance
  const [statusFilter, setStatusFilter] = useState("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentsTodayCount, setAppointmentsTodayCount] = useState(0);
  const [appointmentsThisWeekCount, setAppointmentsThisWeekCount] = useState(0);
  const [queueEntriesToday, setQueueEntriesToday] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPatients, setTotalPatients] = useState(0);
  const fetchPatients = useCallback(
    async (targetPage: number = page) => {
      try {
        setIsLoading(true);
        setError(null);

        const searchParam = debouncedSearchQuery
          ? `&search=${encodeURIComponent(debouncedSearchQuery)}`
          : "";
        
        // Add status filter to API call if not "all"
        // Convert "in-clinic" -> true, "remote" -> false
        const statusParam = statusFilter !== "all"
          ? `&present_in_clinic=${statusFilter === "in-clinic" ? "true" : "false"}`
          : "";
        
        const response = await get(`/api/patients?limit=${pageSize}&page=${targetPage}${searchParam}${statusParam}`);
        
        if (response.success) {
          const payload = response.data as any;
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.patients)
            ? payload.patients
            : [];
          setPatients(list as Patient[]);
          
          // Properly extract total from pagination object
          const pagination = payload?.pagination || {};
          const totalRaw = pagination.total ?? payload?.total;
          
          if (Number.isFinite(Number(totalRaw))) {
            setTotalPatients(Number(totalRaw));
          } else {
            // Fallback: estimate total if not provided
            // If we got a full page, there might be more
            const estimatedTotal = list.length === pageSize 
              ? list.length + (targetPage - 1) * pageSize + 1
              : list.length + (targetPage - 1) * pageSize;
            setTotalPatients(estimatedTotal);
          }
          setPage(targetPage);
        } else {
          setPatients([]);
          setTotalPatients(0);
          if (response.message) {
            setError(response.message);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load patients";
        setError(message);
        setPatients([]);
        setTotalPatients(0);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearchQuery, pageSize, statusFilter]
  );

  const todayRef = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(todayRef), [todayRef]);
  const weekEnd = useMemo(() => endOfDay(todayRef), [todayRef]);

  // Reset to page 1 when search query or status filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearchQuery, statusFilter]);

  // Fetch patients when page, search, or status filter changes
  useEffect(() => {
    fetchPatients(page);
  }, [page, debouncedSearchQuery, statusFilter, fetchPatients]);

  // Load appointment stats in background after patient list loads
  useEffect(() => {
    if (isLoading) return; // Don't fetch stats while loading patients
    const fetchAppointmentStats = async () => {
      try {
        const response = await get("/api/appointments?limit=100");
        if (response.success) {
          const payload = response.data as any;
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.appointments)
            ? payload.appointments
            : [];

          let todayCount = 0;
          let weekCount = 0;
          const today = todayRef;

          list.forEach((apt: any) => {
            const dateValue = normalizeDate(apt?.date);
            if (!dateValue) return;
            if (isSameDay(dateValue, today)) {
              todayCount += 1;
            }
            if (isWithinRange(dateValue, weekStart, weekEnd)) {
              weekCount += 1;
            }
          });

          setAppointmentsTodayCount(todayCount);
          setAppointmentsThisWeekCount(weekCount);
        }
      } catch (err) {
        console.error("Failed to load appointment stats:", err);
        setAppointmentsTodayCount(0);
        setAppointmentsThisWeekCount(0);
      }
    };

    fetchAppointmentStats();
  }, [todayRef, weekEnd, weekStart]);

  useEffect(() => {
    const fetchQueueEntries = async () => {
      try {
        const response = await get("/api/queue");
        console.log('📡 Queue API response:', response);
        
        if (response.success) {
          const payload = response.data as any;
          // Handle response structure: { queue: [...] } or direct array
          const queueList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.queue)
            ? payload.queue
            : Array.isArray(payload?.data)
            ? payload.data
            : [];
          
          console.log('📋 All queue entries extracted:', queueList.length, queueList);
          
          // Filter queue entries from today that are NOT cancelled, completed, or closed
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
          
          const todayQueueEntries = queueList.filter((entry: any) => {
            const checkedInAt = entry.checked_in_at || entry.checkedInAt;
            if (!checkedInAt) {
              console.log('⚠️ Entry missing checked_in_at:', entry);
              return false;
            }
            
            // Parse date - handle ISO string format
            const entryDate = new Date(checkedInAt);
            const entryDateStr = entryDate.toISOString().split("T")[0];
            
            // Compare dates as strings (YYYY-MM-DD)
            const isToday = entryDateStr === todayStr;
            
            // Check status - include: waiting, in-consultation, checkout (exclude: cancelled, completed, closed)
            const status = (entry.status || "").toLowerCase();
            const isActive = status && !["cancelled", "closed"].includes(status);
            // Explicitly include checkout status (patient is still in clinic)
            const isInClinic = ["waiting", "in-consultation", "completed"].includes(status);
            
            console.log(`🔍 Entry: date=${entryDateStr}, today=${todayStr}, isToday=${isToday}, status=${entry.status}, isActive=${isActive}, isInClinic=${isInClinic}`);
            
            return isToday && isInClinic;
          });

          console.log('🔄 Queue entries today (filtered):', todayQueueEntries.length, todayQueueEntries);
          setQueueEntriesToday(todayQueueEntries);
        } else {
          console.warn('⚠️ Queue API response not successful:', response);
          setQueueEntriesToday([]);
        }
      } catch (err) {
        console.error("❌ Failed to load queue entries:", err);
        setQueueEntriesToday([]);
      }
    };

    fetchQueueEntries();
  }, []);

  // No client-side filtering needed - API handles both search and status filter
  // This ensures pagination works correctly
  const filteredPatients = useMemo(() => {
    return patients;
  }, [patients]);

  const inClinicCount = useMemo(() => {
    // Calculate based on actual queue entries today, not just presentInClinic field
    // Get unique patient IDs from today's active queue entries
    const patientIdsInQueueToday = new Set<string>();
    
    queueEntriesToday.forEach((entry: any) => {
      const patientId = entry.patient?._id || entry.patient?.patientId || entry.patient;
      if (patientId) {
        patientIdsInQueueToday.add(String(patientId));
      }
    });
    
    // Count patients who are in today's queue
    return patientIdsInQueueToday.size;
  }, [queueEntriesToday]);

  const newPatientsThisWeek = useMemo(() => {
    return patients.filter((patient) => {
      const createdAt =
        normalizeDate(patient.createdAt) ?? normalizeDate(patient.registeredAt);
      if (!createdAt) return false;
      return isWithinRange(createdAt, weekStart, weekEnd);
    }).length;
  }, [patients, weekEnd, weekStart]);

  const getStatusColor = (patient: Patient): string => {
    if (patient.presentInClinic) {
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
    }
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
  };

  const getStatusText = (patient: Patient): string | null => {
    // Only show status if patient is in-clinic, otherwise show nothing (blank)
    return patient.presentInClinic ? "in-clinic" : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border shadow-sm">
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
            <p className="text-muted-foreground">Loading patients...</p>
          </CardContent>
        </Card>
      </div>
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
      {error && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/10 border-teal-200 dark:border-teal-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {patients.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
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
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ActivityIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {newPatientsThisWeek}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
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
                  Appointments This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {appointmentsThisWeekCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Today: {appointmentsTodayCount}
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
            <Link to="/register-patient">
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Register New Patient
              </Button>
            </Link>
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
              <SelectTrigger className="w-full md:w-[200px]">
                <FilterIcon className="w-4 h-4 mr-2" />

                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-clinic">In Clinic</SelectItem>
                <SelectItem value="remote">Remote Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>
            All Patients
            {totalPatients > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({totalPatients.toLocaleString()})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                        <Badge className={getStatusColor(patient)}>
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
                        className="hover:bg-teal-50 dark:hover:bg-teal-950/20 border-teal-200 dark:border-teal-800"
                      >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link to="/receptionist-appointments">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Pagination Controls */}
          {totalPatients > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalPatients)} of {totalPatients} patients
                {totalPatients > pageSize && (
                  <span className="ml-2">• Page {page} of {Math.max(1, Math.ceil(totalPatients / pageSize))}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    fetchPatients(newPage);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(totalPatients / pageSize) || isLoading || totalPatients === 0}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    fetchPatients(newPage);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
