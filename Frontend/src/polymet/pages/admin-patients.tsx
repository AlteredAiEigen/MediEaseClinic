import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  UserPlusIcon,
  UsersIcon,
  ActivityIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  UserIcon,
  HeartPulseIcon,
} from "lucide-react";
import { get, post } from "@/lib/api-client";
import { MediEaseLoader } from "@/components/mediease-loader";

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

type ApiPatient = {
  _id: string;
  patientId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
  presentInClinic: boolean;
  chiefComplaint?: string | null;
  createdAt?: string;
};

type PatientStatus = "in-clinic" | "remote";

interface UiPatient {
  recordId: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  chiefComplaint?: string | null;
  status: PatientStatus;
  avatar: string;
}

const createAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff`;

const mapApiPatientToUi = (patient: ApiPatient): UiPatient => {
  const status: PatientStatus = patient.presentInClinic ? "in-clinic" : "remote";
  return {
    recordId: patient._id,
    patientId: patient.patientId,
    name: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? "Not provided",
    chiefComplaint: patient.chiefComplaint,
    status,
    avatar: createAvatarUrl(patient.fullName),
  };
};

type NewPatientForm = {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  bloodGroup:
    | "A+"
    | "A-"
    | "B+"
    | "B-"
    | "AB+"
    | "AB-"
    | "O+"
    | "O-";
  address: string;
  dateOfBirth: string;
};

const emptyNewPatientState: NewPatientForm = {
  name: "",
  age: "",
  gender: "Male",
  phone: "",
  email: "",
  bloodGroup: "O+",
  address: "",
  dateOfBirth: "",
};

export function AdminPatients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms debounce
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [patientsList, setPatientsList] = useState<UiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [totalPatients, setTotalPatients] = useState(0);
  const [inClinicToday, setInClinicToday] = useState(0);
  const [newPatientsThisWeek, setNewPatientsThisWeek] = useState(0);
  const [appointmentsThisWeek, setAppointmentsThisWeek] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState(0);

  const [newPatient, setNewPatient] = useState({ ...emptyNewPatientState });

  // Helper to extract list from API response
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
    if (rawData && Array.isArray(rawData.patients)) {
      return rawData.patients as T[];
    }
    return [];
  };

  useEffect(() => {
    let ignore = false;

    const fetchPatients = async () => {
      console.log("🔍 AdminPatients: Starting to fetch patients...");
      setIsLoading(true);
      setFetchError(null);

      try {
        const queryParams = new URLSearchParams({
          limit: String(pageSize),
          page: String(page),
        });

        if (debouncedSearchQuery.trim()) {
          queryParams.set("search", debouncedSearchQuery.trim());
        }

        console.log("🔍 AdminPatients: Making API call to /api/patients...", queryParams.toString());

        const response = await get<any>(`/api/patients?${queryParams.toString()}`);

        if (ignore) return;

        console.log("🔍 AdminPatients: API response received:", {
          success: response.success,
          message: response.message,
          dataLength: Array.isArray(response.data) ? response.data.length : "not array",
          pagination: (response as any).pagination,
        });

        if (response.success) {
          const patientsData = Array.isArray(response.data) ? response.data : [];
          const pagination = (response as any).pagination || {};
          const total = pagination.total ?? patientsData.length;
          const currentPage = pagination.page ?? page;
          const limitFromApi = pagination.limit ?? pageSize;
          const totalPagesCalc = limitFromApi > 0 ? Math.max(1, Math.ceil(total / limitFromApi)) : 1;

          setTotalPatients(total);
          setTotalPages(totalPagesCalc);
          if (currentPage !== page) {
            setPage(currentPage);
          }

          const mappedPatients = patientsData.map(mapApiPatientToUi);
          setPatientsList(mappedPatients);

          console.log("🔍 AdminPatients: Set", mappedPatients.length, "patients for display on page", currentPage);

          // Calculate new patients this week from returned page (best-effort)
          const now = new Date();
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);

          const newThisWeek = patientsData.filter((patient: ApiPatient) => {
            if (!patient.createdAt) return false;
            try {
              const createdDate = new Date(patient.createdAt);
              return createdDate >= weekAgo && !isNaN(createdDate.getTime());
            } catch {
              return false;
            }
          }).length;

          setNewPatientsThisWeek(newThisWeek);
        } else {
          console.error("🔍 AdminPatients: API call failed:", response.message);
          setFetchError(response.message ?? "Unable to load patients right now.");
        }
      } catch (error) {
        if (ignore) return;
        const message = error instanceof Error ? error.message : "Unable to load patients.";
        setFetchError(message);
        console.error("Error fetching patients:", error);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchPatients();

    return () => {
      ignore = true;
    };
  }, [debouncedSearchQuery, page, pageSize]);


  // Fetch queue entries for "In Clinic Today" and appointments for stats
  useEffect(() => {
    const fetchQueueAndAppointments = async () => {
      try {
        // Helper to format date as YYYY-MM-DD in local timezone
        const formatDateLocal = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const today = new Date();
        const weekStart = new Date(today);
        // Start of week (Sunday = 0)
        const dayOfWeek = today.getDay();
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
        weekEnd.setHours(23, 59, 59, 999);
        
        const todayStr = formatDateLocal(today);
        const weekStartStr = formatDateLocal(weekStart);
        const weekEndStr = formatDateLocal(weekEnd);
        
        // Fetch queue entries first
        const queueResponse = await get<any>("/api/queue");
        
        // Calculate "In Clinic Today" from queue entries
        if (queueResponse.success) {
          const payload = queueResponse.data as any;
          const queueList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.queue)
            ? payload.queue
            : Array.isArray(payload?.data)
            ? payload.data
            : [];
          
          // Filter queue entries from today that are active (in clinic)
          const todayQueueEntries = queueList.filter((entry: any) => {
            const checkedInAt = entry.checked_in_at || entry.checkedInAt;
            if (!checkedInAt) return false;
            
            const entryDate = new Date(checkedInAt);
            const entryDateStr = entryDate.toISOString().split("T")[0];
            const isToday = entryDateStr === todayStr;
            
            const status = (entry.status || "").toLowerCase();
            // Include: waiting, in-consultation, completed (patients still in clinic)
            const isInClinic = ["waiting", "in-consultation", "completed"].includes(status);
            
            return isToday && isInClinic;
          });
          
          // Count unique patients in clinic today
          const uniquePatients = new Set(
            todayQueueEntries
              .map((entry: any) => {
                const patientId = entry.patient?._id || entry.patient || entry.patientId;
                return patientId ? String(patientId) : null;
              })
              .filter((id: string | null) => id !== null)
          );
          setInClinicToday(uniquePatients.size);
        }
        
        // Fetch all appointments (handle pagination)
        let allAppointments: any[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore) {
          const appointmentsResponse = await get<any>(`/api/appointments?limit=${limit}&page=${page}`);
          
          if (appointmentsResponse.success) {
            let appointments: any[] = [];
            if (Array.isArray(appointmentsResponse.data)) {
              appointments = appointmentsResponse.data;
            } else {
              appointments = extractList<any>(appointmentsResponse.data);
            }
            
            allAppointments = allAppointments.concat(appointments);
            
            const pagination = (appointmentsResponse as any).pagination;
            if (pagination && pagination.totalPages) {
              hasMore = page < pagination.totalPages;
              page++;
            } else {
              // If no pagination info or we got fewer than limit, we're done
              hasMore = appointments.length === limit;
              page++;
            }
            
            // Safety limit: don't fetch more than 10 pages (1000 appointments)
            if (page > 10) break;
          } else {
            hasMore = false;
          }
        }
        
        // Filter for today
        const todayCount = allAppointments.filter((apt: any) => {
          return apt.date === todayStr;
        }).length;
        
        // Filter for this week
        const weekCount = allAppointments.filter((apt: any) => {
          if (!apt.date) return false;
          const aptDate = apt.date;
          return aptDate >= weekStartStr && aptDate <= weekEndStr;
        }).length;
        
        setAppointmentsToday(todayCount);
        setAppointmentsThisWeek(weekCount);
      } catch (error) {
        console.error("Failed to fetch queue/appointments:", error);
        setAppointmentsToday(0);
        setAppointmentsThisWeek(0);
        setInClinicToday(0);
      }
    };
    
    fetchQueueAndAppointments();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return patientsList.filter((patient) => {
      const matchesSearch =
        query.length === 0 ||
        patient.name.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query);
      const matchesStatus =
        filterStatus === "all" || patient.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [patientsList, debouncedSearchQuery, filterStatus]);

  const handleAddPatient = async () => {
    setSubmissionError(null);
    if (!newPatient.name.trim()) {
      setSubmissionError("Please provide the patient's full name.");
      return;
    }
    if (!newPatient.email.trim()) {
      setSubmissionError("Email address is required.");
      return;
    }
    if (!newPatient.phone.trim()) {
      setSubmissionError("Phone number is required.");
      return;
    }
    if (!newPatient.dateOfBirth) {
      setSubmissionError("Date of birth is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const [firstName, ...rest] = newPatient.name.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : firstName;

      const payload = {
        firstName,
        lastName: lastName || firstName,
        gender: newPatient.gender,
        age: newPatient.age || "0",
        bloodGroup: newPatient.bloodGroup,
        dateOfBirth: newPatient.dateOfBirth,
        email: newPatient.email,
        phone: newPatient.phone,
        address: newPatient.address,
      };

      const response = await post<{ patient: ApiPatient }>("/api/patients", payload);

      if (response.success && response.data?.patient) {
        setPatientsList((prev) => [mapApiPatientToUi(response.data!.patient), ...prev]);
        setAddPatientDialogOpen(false);
        setNewPatient({ ...emptyNewPatientState });
        setSubmissionError(null);
      } else {
        setSubmissionError(response.message ?? "Unable to add patient. Please try again.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add patient. Please try again.";
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case "in-clinic":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "remote":
      default:
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
    }
  };

const statusLabels: Record<PatientStatus, string> = {
  "in-clinic": "In Clinic",
  remote: "Remote Follow-up",
};

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {totalPatients}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Clinic Today
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {inClinicToday}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <HeartPulseIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 shadow-sm hover:shadow-md transition-shadow">
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
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appointments This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {appointmentsThisWeek}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Today: {appointmentsToday}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[#00C4B3]" />
            Patient Records
          </CardTitle>
          <Dialog
            open={addPatientDialogOpen}
            onOpenChange={(open) => {
              setAddPatientDialogOpen(open);
              if (!open) {
                setSubmissionError(null);
                setIsSubmitting(false);
                setNewPatient({ ...emptyNewPatientState });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Register a new patient in the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newPatient.name}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={newPatient.age}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, age: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(value) =>
                      setNewPatient({
                        ...newPatient,
                        gender: value as NewPatientForm["gender"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select
                    value={newPatient.bloodGroup}
                    onValueChange={(value) =>
                      setNewPatient({
                        ...newPatient,
                        bloodGroup: value as NewPatientForm["bloodGroup"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={newPatient.address}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, address: e.target.value })
                    }
                  />
                </div>
              </div>
              {submissionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {submissionError}
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddPatientDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPatient}
                  className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Patient"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {fetchError}
            </div>
          )}
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-clinic">In Clinic</SelectItem>
                <SelectItem value="remote">Remote Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <MediEaseLoader message="Loading patient records..." />
          ) : (
            <>
              {/* Patients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.recordId}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/patient-overview/${patient.recordId}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/patient-overview/${patient.recordId}`);
                      }
                    }}
                    className="border-border hover:shadow-lg transition-all hover:border-[#00C4B3]/30 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C4B3] bg-card"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16 border-2 border-[#00C4B3]/20">
                          <AvatarImage src={patient.avatar} alt={patient.name} />

                          <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {patient.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                ID: {patient.patientId}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={getStatusBadge(patient.status)}
                            >
                              {statusLabels[patient.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="w-3 h-3" />

                              <span>Age: {patient.age} years</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <PhoneIcon className="w-3 h-3" />

                              <span className="truncate">{patient.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MailIcon className="w-3 h-3" />

                              <span className="truncate">{patient.email}</span>
                            </div>
                            {patient.chiefComplaint && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ActivityIcon className="w-3 h-3" />

                                <span className="truncate">
                                  Complaint: {patient.chiefComplaint}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/patient-overview/${patient.recordId}`);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate("/admin-appointments");
                          }}
                        >
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {filteredPatients.length === 0 && !fetchError && (
                <div className="text-center py-12">
                  <AlertCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

                  <p className="text-muted-foreground">No patients found</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
